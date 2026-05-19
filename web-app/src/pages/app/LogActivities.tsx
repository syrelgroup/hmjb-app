import { Table, Space, Tag, Typography, DatePicker, Input } from "antd";
import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import api from "../../libs/api";
import moment from "moment";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface LogActivity {
  id: string;
  action: string;
  method: string;
  status: string;
  ip: string;
  userAgent: string;
  payload?: string;
  created_at: string;
  User?: {
    fullname: string;
    username: string;
  };
}

export default function LogActivities() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogActivity[]>([]);
  const [pageProps, setPageProps] = useState({
    page: 1,
    limit: 50,
    total: 0,
    search: "",
    dateRange: null as [moment.Moment, moment.Moment] | null,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageProps.page.toString());
      params.append("limit", pageProps.limit.toString());
      if (pageProps.search) params.append("search", pageProps.search);
      if (pageProps.dateRange) {
        params.append("startDate", pageProps.dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", pageProps.dateRange[1].format("YYYY-MM-DD"));
      }

      const response = await api.request({
        url: `${import.meta.env.VITE_API_URL}/log-activities?${params.toString()}`,
        method: "GET",
      });

      setLogs(response.data.data);
      setPageProps((prev) => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchLogs();
    })();
  }, [pageProps.page, pageProps.limit, pageProps.search, pageProps.dateRange]);

  const columns: ColumnsType<LogActivity> = [
    {
      title: "No",
      key: "no",
      render: (_, __, index) =>
        (pageProps.page - 1) * pageProps.limit + index + 1,
    },
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.User?.fullname || "Unknown"}
          </div>
          <div className="text-sm text-gray-500">@{record.User?.username}</div>
        </div>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "SUCCESS" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "Time",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => moment(date).format("YYYY-MM-DD HH:mm:ss"),
      sorter: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={2}>Log Aktivitas</Title>
          <p className="text-slate-500 text-sm">
            Riwayat semua aktivitas pengguna dalam sistem.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <Space className="mb-4 flex-wrap" size="small">
          <Input.Search
            size="small"
            placeholder="Cari aktivitas atau user..."
            allowClear
            onChange={(value) =>
              setPageProps({ ...pageProps, search: value.target.value })
            }
            style={{ minWidth: 250 }}
          />
          <RangePicker
            size="small"
            onChange={(dates) =>
              setPageProps({
                ...pageProps,
                dateRange: dates as [moment.Moment, moment.Moment] | null,
              })
            }
          />
        </Space>

        <Table
          size="small"
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey={(record) => record.id}
          pagination={{
            current: pageProps.page,
            pageSize: pageProps.limit,
            total: pageProps.total,
            onChange: (page, pageSize) =>
              setPageProps({ ...pageProps, page, limit: pageSize }),
            pageSizeOptions: [50, 100, 200],
            showSizeChanger: true,
            // showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} aktivitas`,
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
}
