import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionaColunaEmUser1794339474211 implements MigrationInterface {
    name = 'AdicionaColunaEmUser1794339474211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "emailOnFollow" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailOnFollow"`);
    }

}
