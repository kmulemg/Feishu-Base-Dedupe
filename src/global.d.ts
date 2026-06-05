/**
 * 全局类型声明
 */

// 声明 Base JS SDK 模块
declare module '@lark-base-open/js-sdk' {
  export interface IEventCbCtx<T = any> {
    data: T;
  }

  export interface ThemeModeCtx {
    theme: 'LIGHT' | 'DARK';
  }

  export interface Bridge {
    getTheme(): Promise<'LIGHT' | 'DARK'>;
    onThemeChange(callback: (ev: IEventCbCtx<ThemeModeCtx>) => void): () => void;
    getInstanceId(): Promise<string>;
  }

  export interface FieldMeta {
    id: string;
    name: string;
    type: number;
  }

  export interface ITable {
    getName(): Promise<string>;
    getFieldMetaList(): Promise<FieldMeta[]>;
    getActiveView(): Promise<IView>;
    getRecordIdList(): Promise<string[]>;
    getRecords(params: { pageSize?: number; pageToken?: string; viewId?: string }): Promise<{
      total: number;
      hasMore: boolean;
      records: Array<{ recordId: string; fields: Record<string, any> }>;
      pageToken?: string;
    }>;
    setRecord(recordId: string, recordValue: { fields: Record<string, any> }): Promise<void>;
    deleteRecords(recordIds: string[]): Promise<void>;
    addRecords(records: any[]): Promise<string[]>;
  }

  export interface IView {
    getFieldMetaList(): Promise<FieldMeta[]>;
    getVisibleFieldIdList(): Promise<string[]>;
  }

  export interface Base {
    getActiveTable(): Promise<ITable>;
    getTableById(tableId: string): Promise<ITable>;
    getSelection(): Promise<{ tableId: string; viewId: string }>;
    addTable(params: { name: string; fields?: any[] }): Promise<ITable>;
    setTable(params: { tableId: string; name?: string }): Promise<void>;
    deleteTable(tableId: string): Promise<void>;
  }

  export interface UI {
    // 可根据需要添加更多 UI 方法
  }

  export interface Bitable {
    base: Base;
    ui: UI;
    bridge: Bridge;
  }

  export const bitable: Bitable;

  // 字段类型
  export enum FieldType {
    Text = 1,
    Number = 2,
    SingleSelect = 3,
    MultiSelect = 4,
    DateTime = 5,
    Checkbox = 7,
    URL = 15,
    Attachment = 17,
    Link = 18,
    Currency = 19,
    Rating = 20,
  }

  // 字段接口（根据需要扩展）
  export interface ITextField {
    getValue(recordId: string): Promise<string>;
    setValue(recordId: string, value: string): Promise<void>;
  }

  export interface ITextFieldMeta {
    id: string;
    name: string;
    type: number;
  }

  export interface ICurrencyField {
    getValue(recordId: string): Promise<number>;
    setValue(recordId: string, value: number): Promise<void>;
    getCurrencyCode(): Promise<string>;
    setCurrencyCode(code: string): Promise<void>;
  }

  export interface ICurrencyFieldMeta {
    id: string;
    name: string;
    type: number;
  }

  export interface IAttachmentField {
    getValue(recordId: string): Promise<any[]>;
    setValue(recordId: string, value: any): Promise<void>;
    createCell(file: File): Promise<any>;
  }

  export interface ISingleSelectField {
    getValue(recordId: string): Promise<string>;
    setValue(recordId: string, value: string): Promise<void>;
    addOption(option: string): Promise<void>;
  }

  export interface IRecord {
    recordId: string;
    fields: Record<string, any>;
  }
}
