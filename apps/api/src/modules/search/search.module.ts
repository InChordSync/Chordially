import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller.js';
@Module({ controllers: [SearchController] })
export class SearchModule {}
