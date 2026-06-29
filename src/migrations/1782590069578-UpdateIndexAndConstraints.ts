import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateIndexAndConstraints1782590069578 implements MigrationInterface {
    name = 'UpdateIndexAndConstraints1782590069578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "UQ_99bcb5fdac446371d41f048b24f"`);
        await queryRunner.query(`CREATE INDEX "IDX_NOTIFICATION_ISREAD" ON "notifications"  ("isRead") `);
        await queryRunner.query(`CREATE INDEX "IDX_NOTIFICATION_USER_ID" ON "notifications"  ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ACTIVITYLOG_TASKID" ON "activity_logs"  ("taskId") `);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "UNQ_WORKSPACEMEMBER_WORKSPACEID_USERID" UNIQUE ("workspaceId", "userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "UNQ_WORKSPACEMEMBER_WORKSPACEID_USERID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ACTIVITYLOG_TASKID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_NOTIFICATION_USER_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_NOTIFICATION_ISREAD"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "UQ_99bcb5fdac446371d41f048b24f" UNIQUE ("userId", "workspaceId")`);
    }

}
