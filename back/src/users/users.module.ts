import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // Se declara la entidad para que TypeORM exponga su Repository via @InjectRepository
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  // Se exporta el servicio porque AuthModule lo necesita (registro y login)
  exports: [UsersService],
})
export class UsersModule {}
