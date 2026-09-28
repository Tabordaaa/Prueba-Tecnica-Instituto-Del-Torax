import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { ImportError } from './entities/import-error.entity';
import { ImportRecord } from './entities/import-record.entity';
import { Person } from './entities/person.entity';
import { EtlController } from './etl.controller';
import { EtlService } from './etl.service';

@Module({
  imports: [TypeOrmModule.forFeature([Person, ImportRecord, ImportError, User])],
  controllers: [EtlController],
  providers: [EtlService],
  exports: [EtlService],
})
export class EtlModule {}
