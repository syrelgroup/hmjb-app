import {
  CloudUploadOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, Upload, Tooltip, type UploadProps } from "antd";
import type { IFile, IFileVisit } from "../../libs/interface";
import { useState } from "react";
import api from "../../libs/api";

export const IDRFormat = (number: number) => {
  const temp = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: "decimal",
    currency: "IDR",
  }).format(number);
  return temp;
};

export const IDRToNumber = (str: string) => {
  return parseInt(str.replace(/\D/g, ""));
};

export const InputUtil = ({
  label,
  value,
  onchage,
  disabled,
  type,
  options,
  prefix,
  suffix,
  required = false,
  placeholder,
  layout,
}: {
  label: string | React.ReactNode;
  value?: any;
  onchage?: Function;
  disabled?: boolean;
  type: "text" | "number" | "option" | "area" | "date" | "password" | "upload";
  options?: { label: string; value: any }[];
  prefix?: any;
  suffix?: any;
  required?: boolean;
  placeholder?: string;
  layout?: "horizontal" | "vertical";
}) => {
  const handleType = (
    type:
      | "text"
      | "number"
      | "option"
      | "area"
      | "date"
      | "password"
      | "upload",
  ) => {
    switch (type) {
      case "number": {
        return (
          <Input
            type={"number"}
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(Number(e.target.value))}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
            placeholder={placeholder}
            style={{ color: "black" }}
            allowClear
          />
        );
      }
      case "date": {
        return (
          <Input
            type={"date"}
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(e.target.value)}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
            style={{ color: "black" }}
            placeholder={placeholder}
            allowClear
          />
        );
      }
      case "password": {
        return (
          <Input.Password
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(e.target.value)}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
            style={{ color: "black" }}
            placeholder={placeholder}
            allowClear
          />
        );
      }
      case "option": {
        return (
          <Select
            style={{ width: "100%" }}
            value={value}
            onChange={(e) => onchage && onchage(e)}
            disabled={disabled}
            options={options}
            showSearch
            optionFilterProp={"label"}
            prefix={prefix}
            suffix={suffix}
            placeholder={placeholder}
            allowClear
          />
        );
      }
      case "area": {
        return (
          <Input.TextArea
            value={value}
            onChange={(e) => onchage && onchage(String(e.target.value))}
            disabled={disabled}
            style={{ color: "black" }}
            placeholder={placeholder}
            allowClear
          />
        );
      }
      case "upload": {
        return (
          <OneFileUpload
            url={value}
            onchange={(url: string) => onchage && onchage(url)}
            ondelete={() => onchage && onchage(null)}
            filetype="*"
            label={true}
          />
        );
      }
      default: {
        return (
          <Input
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(String(e.target.value))}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
            placeholder={placeholder}
            style={{ color: "black" }}
            allowClear
          />
        );
      }
    }
  };
  return (
    <>
      {layout === "horizontal" ? (
        <div className="flex items-center gap-2">
          <div style={{ width: "30%" }}>
            <span>
              {label} {required && <span className="text-red-500">*</span>}
            </span>
          </div>
          <div style={{ flex: 1 }}>{handleType(type)}</div>
        </div>
      ) : (
        <div className="flex flex-col">
          <p>
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          {handleType(type)}
        </div>
      )}
    </>
  );
};

export const InputFileUpload = ({
  record,
  onchange,
  ondelete,
  filetype,
  canDelete,
}: {
  record: IFile;
  onchange: Function;
  ondelete: Function;
  filetype: string;
  canDelete?: boolean;
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formData,
      })
      .then((res) => onchange({ ...record, url: res.data.url }))
      .catch((err) => {
        console.log(err);
        alert(err);
      });
    setLoading(false);
  };

  const getAcceptType = (type: string) => {
    switch (type) {
      case "image":
        return "image/*"; // Semua jenis gambar (jpg, png, webp, dll)
      case "video":
        return "video/*"; // Semua jenis video (mp4, mov, avi, dll)
      case "pdf":
        return ".pdf,application/pdf";
      default:
        return "*";
    }
  };

  const props: UploadProps = {
    beforeUpload: async (file) => {
      setLoading(true);
      await handleUpload(file);
      setLoading(false);
      return false; // prevent automatic upload
    },
    showUploadList: false, // sembunyikan default list
    accept: getAcceptType(filetype),
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        size="small"
        value={record.name}
        onChange={(e) => onchange({ ...record, name: e.target.value })}
      />
      {record.url ? (
        <Tooltip
          title={
            canDelete
              ? "Hapus file"
              : "Perlu membuat permohonan penghapusan file terlebih dahulu"
          }
        >
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => ondelete()}
            loading={loading}
            disabled={!canDelete}
          ></Button>
        </Tooltip>
      ) : (
        <Upload {...props}>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            type="primary"
            disabled={!record.name}
            loading={loading}
          ></Button>
        </Upload>
      )}
    </div>
  );
};

export const InputFileUploadVisit = ({
  record,
  onchange,
  ondelete,
  filetype,
  noname,
}: {
  record: IFileVisit;
  onchange: Function;
  ondelete: Function;
  filetype: string;
  noname?: boolean;
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formData,
      })
      .then((res) => onchange({ ...record, url: res.data.url }))
      .catch((err) => {
        console.log(err);
        alert(err);
      });
    setLoading(false);
  };

  const props: UploadProps = {
    beforeUpload: async (file) => {
      setLoading(true);
      await handleUpload(file);
      setLoading(false);
      return false; // prevent automatic upload
    },
    showUploadList: false, // sembunyikan default list
    accept: filetype,
  };

  return (
    <div className="flex gap-2">
      <Input
        size="small"
        value={record.name}
        onChange={(e) => onchange({ ...record, name: e.target.value })}
        hidden={noname}
      />
      {record.url ? (
        <Button
          size="small"
          icon={<DeleteOutlined />}
          danger
          onClick={() => ondelete()}
          loading={loading}
        ></Button>
      ) : (
        <Upload {...props}>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            type="primary"
            disabled={!record.name && !noname}
            loading={loading}
          ></Button>
        </Upload>
      )}
    </div>
  );
};

export const OneFileUpload = ({
  url,
  onchange,
  ondelete,
  filetype,
  label,
}: {
  url: string | null;
  onchange: Function;
  ondelete: Function;
  filetype: string;
  label?: boolean;
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formData,
      })
      .then((res) => onchange(res.data.url))
      .catch((err) => {
        console.log(err);
        alert(err);
      });
    setLoading(false);
  };

  const props: UploadProps = {
    beforeUpload: async (file) => {
      setLoading(true);
      await handleUpload(file);
      setLoading(false);
      return false; // prevent automatic upload
    },
    showUploadList: false, // sembunyikan default list
    accept: filetype,
  };

  return (
    <div className="flex gap-2 justify-between items-center">
      {!label && <div className="flex-1">Upload File</div>}
      <div className="flex-1 flex justify-end">
        {url ? (
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => ondelete()}
            loading={loading}
          ></Button>
        ) : (
          <Upload {...props}>
            <Button
              size="small"
              icon={<CloudUploadOutlined />}
              type="primary"
              loading={loading}
            >
              Browse
            </Button>
          </Upload>
        )}
      </div>
    </div>
  );
};
