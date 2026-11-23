import { Injectable } from '@nestjs/common';
import { ROOT_PAGE } from './root-page';

@Injectable()
export class AppService {
   getHello(): string {
      return ROOT_PAGE;
   }
}
