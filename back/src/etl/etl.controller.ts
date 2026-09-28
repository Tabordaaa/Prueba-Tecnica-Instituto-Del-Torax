import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportRecord } from './entities/import-record.entity';
import { Person } from './entities/person.entity';
import { EtlService } from './etl.service';
import { User } from '../users/entities/user.entity';

@Controller('etl')
export class EtlController {
  constructor(
    private readonly etlService: EtlService,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(ImportRecord)
    private readonly importRecordRepository: Repository<ImportRecord>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * GET /api/etl/dashboard
   * Obtiene las estadísticas para el dashboard.
   */
  @Get('dashboard')
  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const totalFiles = await this.importRecordRepository.count();
    const totalRecords = await this.personRepository.count();

    // Sumar registros válidos e inválidos de todas las importaciones
    const importRecords = await this.importRecordRepository.find();
    const totalValidRows = importRecords.reduce(
      (sum, record) => sum + record.validRows,
      0,
    );
    const totalInvalidRows = importRecords.reduce(
      (sum, record) => sum + record.invalidRows,
      0,
    );

    return {
      success: true,
      data: {
        totalUsers,
        totalFiles,
        totalRecords,
        totalValidRows,
        totalInvalidRows,
      },
    };
  }

  /**
   * POST /api/etl/upload
   * Recibe un archivo CSV, lo valida y procesa el ETL.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndProcess(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    try {
      console.log('[EtlController] Recibiendo archivo...');

      if (!file) {
        throw new BadRequestException('No se proporcionó ningún archivo');
      }

      console.log('[EtlController] Archivo recibido:', file.originalname);

      // Validar extensión
      const originalName = file.originalname.toLowerCase();
      if (!originalName.endsWith('.csv')) {
        throw new BadRequestException('Solo se permiten archivos .csv');
      }

      const result = await this.etlService.processCsv(
        file,
        user.id,
        user.name ?? user.email,
      );

      return {
        success: true,
        message: 'Proceso ETL completado',
        data: {
          importId: result.importId,
          totalRows: result.totalRows,
          validRows: result.validRows,
          invalidRows: result.invalidRows,
          duplicatesFound: result.duplicatesFound,
          importedRows: result.importedRows,
          errors: result.errors,
        },
      };
    } catch (error: any) {
      console.error('[EtlController] Error completo:', error);

      // Si ya es una excepción de NestJS, la relanzamos
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Para otros errores, devolvemos un mensaje más descriptivo
      const message = error?.message ?? 'Error desconocido';
      throw new InternalServerErrorException(
        `Error al procesar el archivo: ${message}`,
      );
    }
  }

  /**
   * GET /api/etl/history
   * Obtiene el historial de archivos importados.
   */
  @Get('history')
  async getHistory() {
    const history = await this.etlService.getHistory();

    return {
      success: true,
      data: history,
    };
  }

  /**
   * GET /api/etl/errors
   * Obtiene todos los errores con el nombre del archivo.
   */
  @Get('errors')
  async getAllErrors() {
    const errors = await this.etlService.getAllErrors();

    return {
      success: true,
      data: errors,
    };
  }

  /**
   * GET /api/etl/errors/files
   * Obtiene la lista de archivos que tienen errores.
   */
  @Get('errors/files')
  async getFilesWithErrors() {
    const files = await this.etlService.getFilesWithErrors();

    return {
      success: true,
      data: files,
    };
  }

  /**
   * GET /api/etl/errors/:importId
   * Obtiene los errores de una importación específica.
   */
  @Get('errors/:importId')
  async getErrors(@Param('importId', ParseIntPipe) importId: number) {
    const errors = await this.etlService.getErrors(importId);

    return {
      success: true,
      data: errors,
    };
  }

  /**
   * GET /api/etl/people
   * Lista todas las personas importadas con paginación, filtros y búsqueda.
   *
   * Query params:
   * - page: número de página (default: 1)
   * - limit: registros por página (default: 10)
   * - search: búsqueda por documento, nombre, apellidos o email
   * - estado: filtro por estado (ACTIVO, INACTIVO)
   * - ciudad: filtro por ciudad
   */
  @Get('people')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('estado') estado?: string,
    @Query('ciudad') ciudad?: string,
  ) {
    const queryBuilder = this.personRepository.createQueryBuilder('person');

    // Búsqueda por documento, nombre, apellidos o email
    if (search) {
      queryBuilder.andWhere(
        '(person.documento LIKE :search OR person.nombres LIKE :search OR person.apellidos LIKE :search OR person.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtro por estado
    if (estado) {
      queryBuilder.andWhere('person.estado = :estado', { estado });
    }

    // Filtro por ciudad
    if (ciudad) {
      queryBuilder.andWhere('person.ciudad = :ciudad', { ciudad });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenar por fecha de creación descendente
    queryBuilder.orderBy('person.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
