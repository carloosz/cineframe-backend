import { MigrationInterface, QueryRunner } from "typeorm";

export class CriaEntidadeNotification1793824060228 implements MigrationInterface {
    name = 'CriaEntidadeNotification1793824060228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "recipientId" uuid NOT NULL, "actorId" uuid NOT NULL, "type" character varying NOT NULL, "reviewId" uuid, "tmdbId" integer, "readAt" TIMESTAMP WITH TIME ZONE, "dedupeKey" character varying NOT NULL, CONSTRAINT "UQ_0e0a4efa44850566408fa4a1fa0" UNIQUE ("dedupeKey"), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9561d5f9d231181193bc146334" ON "notification"  ("recipientId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_ab7cbe7a013ecac5da0a8f88884" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_c5133a026bd1b3d9feccac1a234" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_d523fa0de7f08e019c81187a586" FOREIGN KEY ("reviewId") REFERENCES "user_movie"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_d523fa0de7f08e019c81187a586"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_c5133a026bd1b3d9feccac1a234"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_ab7cbe7a013ecac5da0a8f88884"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9561d5f9d231181193bc146334"`);
        await queryRunner.query(`DROP TABLE "notification"`);
    }

}
