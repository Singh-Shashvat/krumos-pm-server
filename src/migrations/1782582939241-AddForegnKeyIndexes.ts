import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForegnKeyIndexes1782582939241 implements MigrationInterface {
    name = 'AddForegnKeyIndexes1782582939241'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_COMMENT_AUTHOR_ID" ON "comments"  ("authorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_COMMENT_TASK_ID" ON "comments"  ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_PROJECT_WORKSPACE_ID" ON "projects"  ("workspaceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_REPORTER_ID" ON "tasks"  ("reporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_ASSIGNEE_ID" ON "tasks"  ("assigneeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_PROJECT_ID" ON "tasks"  ("projectId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_PROJECT_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_ASSIGNEE_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_REPORTER_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROJECT_WORKSPACE_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_COMMENT_TASK_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_COMMENT_AUTHOR_ID"`);
    }

}
