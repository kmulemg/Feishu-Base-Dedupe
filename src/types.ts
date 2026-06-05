/**
 * 类型定义
 */

// 检测记录数据结构
export interface DetectionRecord {
  recordId: string;
  detectionCode: string;  // 检测字段的值
  fields: Record<string, any>;  // 其他字段数据
}

// 重复检测结果
export interface DuplicateResult {
  code: string;  // 重复字段的值
  records: DetectionRecord[];  // 拥有相同值的记录
}

// 合并策略类型
export type MergeStrategy = 'overwrite' | 'keep' | 'merge';

// 冲突信息
export interface ConflictInfo {
  detectionCode: string;
  existingRecord: DetectionRecord;
  newData: Record<string, any>;
  allRecords: DetectionRecord[];
}

// 字段冲突详情
export interface FieldConflict {
  fieldId: string;
  fieldName: string;
  fieldType: number;
  values: {
    recordId: string;
    value: any;
    displayValue: string;
  }[];
  hasConflict: boolean;
  resolvedValue?: any;
}

// 重复记录的冲突分析结果
export interface DuplicateConflictAnalysis {
  detectionCode: string;
  records: DetectionRecord[];
  autoMergeFields: Record<string, any>;  // 可以自动合并的字段
  conflictFields: FieldConflict[];  // 需要手动选择的冲突字段
  hasConflicts: boolean;
}

// 合并日志记录
export interface MergeLog {
  timestamp: string;
  detectionCode: string;
  primaryRecordId: string;
  mergedRecordIds: string[];
  autoMergeFields: Record<string, any>;
  manualResolveFields: Record<string, { from: any; to: any }>;
  totalFieldsMerged: number;
  totalConflictsResolved: number;
}

// 主题类型
export type ThemeMode = 'LIGHT' | 'DARK';

// 字段元数据
export interface FieldMeta {
  id: string;
  name: string;
  type: number;
}