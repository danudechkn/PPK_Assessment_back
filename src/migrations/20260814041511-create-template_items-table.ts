import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("template_items", {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        section_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "template_sections",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        kpi_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        competency_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: "competencies",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        default_weight: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("template_items");
} 