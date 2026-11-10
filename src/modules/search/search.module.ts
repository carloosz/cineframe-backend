import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { MovieModule } from '../movie/movie.module';
import { UserModule } from '../user/users.module';

@Module({
   imports: [MovieModule, UserModule],
   controllers: [SearchController],
})
export class SearchModule {}
