import moment from "moment";
import type { IExportData, IMenu } from "./interface";
import * as xlsx from "xlsx";

export const MenuPermission = (
  items: IMenu[],
  allowedKeys: string[],
): any[] => {
  return items
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = MenuPermission(item.children, allowedKeys);
        const { need_access, ...c } = item;

        if (filteredChildren.length > 0) {
          return {
            ...c,
            children: filteredChildren,
          };
        }
      }
      const { need_access, ...rt } = item;
      const isAllowed = !item.need_access
        ? true
        : allowedKeys.includes(item.path);
      if (isAllowed) {
        return rt;
      }

      return null;
    })
    .filter(Boolean) as any[];
};

export const ExportData = (data: IExportData[], filename: string) => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Data Submission");
  const maxProps = Object.keys(data[0] || {});
  worksheet["!cols"] = maxProps.map(() => ({ wch: 20 }));
  const timestamp = moment().format("DDMMYY_HHss");
  xlsx.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};
