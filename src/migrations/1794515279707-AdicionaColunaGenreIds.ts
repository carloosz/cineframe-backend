import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaColunaGenreIds1794515279707 implements MigrationInterface {
    name = 'AdicionaColunaGenreIds1794515279707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_movie" ADD "genreIds" integer array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_movie" DROP COLUMN "genreIds"`);
    }

}
