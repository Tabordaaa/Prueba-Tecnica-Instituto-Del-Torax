import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Person } from './entities/person.entity';
import { EtlService } from './etl.service';

@Controller('etl')
export class EtlController {
  constructor(
    private readonly etlService: EtlService,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  /**
   * POST /api/etl/upload
   * Recibe un archivo CSV, lo valida y procesa el ETL.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndProcess(
    @UploadedFile() file: any,
    @CurrentUser() user: { id: number },
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

      const result = await this.etlService.processCsv(file, user.id);

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
   * GET /api/etl/people
   * Lista todas las personas importadas.
   */
  async findAll() {
    const people = await this.personRepository.find({
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      data: people,
    };
  }
}
