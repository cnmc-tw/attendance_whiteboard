import { SettingsRepository } from "./repository";
import { Setting } from "./types";


export type ReportConfig = {

    report_start_time: string;

    report_end_time: string;

    report_cooldown_seconds: string;

    semester_start: string;

    semester_end: string;

}


export type ClassNumberingConfig = {
    baseYear: string;
    baseClass: string;
    classesPerGrade: string;
};

export type SystemConfig = {
    report: ReportConfig;
    classNumbering: ClassNumberingConfig;
};

export interface SystemService {
    
    
    getReportConfig(): Promise<ReportConfig | null>;

    getClassNumberingConfig(): Promise<ClassNumberingConfig | null>;

    getSettings(): Promise<SystemConfig>;

    setSettings(setting: SystemConfig): Promise<void>;


}


class DefaultSystemsService 
implements SystemService {

    constructor(
        private readonly settingsRepository: SettingsRepository,
    ) {}

    async getReportConfig(): Promise<ReportConfig | null> {
        const keys = [
            "report_start_time",
            "report_end_time",
            "report_cooldown_seconds",
            "semester_start_date",
            "semester_end_date",
        ];

        const settings = await this.settingsRepository.getMany(keys);

        if (settings.length === 0) {
            return null;
        }

        const settingsMap = new Map(settings.map(s => [s.key, s.value]));

        const config: ReportConfig = {
            report_start_time: settingsMap.get("report_start_time") || "",
            report_end_time: settingsMap.get("report_end_time") || "",
            report_cooldown_seconds: settingsMap.get("report_cooldown_seconds") || "",
            semester_start: settingsMap.get("semester_start_date") || "",
            semester_end: settingsMap.get("semester_end_date") || "",
        };

        return config;
    }

    async getClassNumberingConfig(): Promise<ClassNumberingConfig | null> {
        const keys = [
            "base_year",
            "base_class",
            "classes_per_grade",
        ];

        const settings = await this.settingsRepository.getMany(keys);

        if (settings.length === 0) {
            return null;
        }

        const settingsMap = new Map(settings.map(s => [s.key, s.value]));


        const config: ClassNumberingConfig = {
            baseYear: settingsMap.get("base_year") || "0",
            baseClass: settingsMap.get("base_class") || "0",
            classesPerGrade: settingsMap.get("classes_per_grade") || "0",
        };

        return config;
    }

    private buildSystemConfig(
        settings: Setting[]
    ): SystemConfig {
        const map = new Map(
            settings.map(setting => [
                setting.key,
                setting.value
            ])
        );

        return {
            report: {
                report_start_time:
                    map.get("report_start_time")!,
                report_end_time:
                    map.get("report_end_time")!,
                report_cooldown_seconds:
                    map.get("report_cooldown_seconds")!,

                semester_start:
                    map.get("semester_start_date")!,
                semester_end:
                    map.get("semester_end_date")!,
            },

            classNumbering: {
                baseYear:
                    map.get("base_year")!,
                baseClass:
                    map.get("base_class")!,
                classesPerGrade:
                    map.get("classes_per_grade")!,
            }
        };
    }

    async getSettings(): Promise<SystemConfig> {
        const settings = await this.settingsRepository.getAll();

        return this.buildSystemConfig(settings);
    }

    async setSettings(settings: SystemConfig): Promise<void> {
        const settingsToSave: Setting[] = [
            { key: "report_start_time", value: settings.report.report_start_time },
            { key: "report_end_time", value: settings.report.report_end_time },
            { key: "report_cooldown_seconds", value: settings.report.report_cooldown_seconds },
            { key: "semester_start_date", value: settings.report.semester_start },
            { key: "semester_end_date", value: settings.report.semester_end },
            { key: "base_year", value: settings.classNumbering.baseYear.toString() },
            { key: "base_class", value: settings.classNumbering.baseClass.toString() },
            { key: "classes_per_grade", value: settings.classNumbering.classesPerGrade.toString() },
        ];
        await this.settingsRepository.setMany(settingsToSave);
    }
}

export function createSystemService(
    settingsRepository: SettingsRepository
): SystemService {
    return new DefaultSystemsService(settingsRepository);
}