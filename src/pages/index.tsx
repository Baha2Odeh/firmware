import { Button, Input, Menu, Row, Spin, Table, TableColumnProps } from "antd";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import useSWR from "swr";

const inter = Inter({ subsets: ["latin"] });

interface FirmwareItem {
  firmwareDate: Date;
  firmwareVersion: string;
  signature: string;
  md5: string;
  secVersion: string;
  downloadUrl: string;
  productRelease: string;
  apeSig: string;
  apeSig25: string;
  apeSig3: string;
  fileType: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const items = [
  {
    key: "cars",
    label: "Models",
    children: [
      { key: "s", label: "Model S", href: "/model-s.html" },
      { key: "3", label: "Model 3", href: "/model-3.html" },
      { key: "x", label: "Model X", href: "/model-x.html" },
      { key: "Y", label: "Model Y", href: "/model-y.html" },
      { key: "R", label: "Roadster", href: "/custom/Roadster" },
    ],
  },
  {
    key: "toolbox",
    label: "Toolbox",
    children: [
      { key: "articles", label: "Articles", href: "/articles.html" },
      { key: "odj", label: "ODJ", href: "/odj.html" },
    ],
  },
  { key: "bulletins", label: "Service Bulletins", href: "/docs/bulletins/" },
];

export function FirmwareTable() {
  const { data, error } = useSWR("/firmware/signatures.json", fetcher);
  const [searchQuery, setSearchQuery] = useState("");

  if (error) return <div>Failed to load firmware data.</div>;
  if (!data) return <Spin spinning size="large" />;

  const dataWithFileType = data.map((item: FirmwareItem) => {
    const fileType = item.downloadUrl.split(".").pop();
    const firmwareDate = new Date(item.firmwareDate);
    return { ...item, fileType, firmwareDate };
  });

  const filteredData = dataWithFileType.filter((item: FirmwareItem) =>
    JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Array<TableColumnProps<FirmwareItem>> = [
    {
      title: "Firmware Version",
      dataIndex: "firmwareVersion",
      defaultSortOrder: "descend" as const,
      sorter: (a, b) =>
        a.firmwareDate.getTime() - b.firmwareDate.getTime() ||
        a.firmwareVersion.localeCompare(b.firmwareVersion),
      render: (text: string, record) => (
        <Button type="link" href={record.downloadUrl} download>
          {text}
        </Button>
      ),
    },
    {
      title: "Firmware Date",
      dataIndex: "firmwareDate",
      render: (value: Date) => value.toLocaleDateString(),
      sorter: (a, b) => a.firmwareDate.getTime() - b.firmwareDate.getTime(),
    },
    {
      title: "File Type",
      dataIndex: "fileType",
      filters: [
        { text: "ape2", value: "ape2" },
        { text: "ape25", value: "ape25" },
        { text: "ape3", value: "ape3" },
        { text: "ice", value: "ice" },
        { text: "map", value: "map" },
        { text: "mcu1", value: "mcu1" },
        { text: "mcu2", value: "mcu2" },
      ],
      onFilter: (value, record) => record.fileType === value,
    },
    {
      title: "Matching APE",
      dataIndex: "matchingAPE",
      key: "matchingAPE",
      render: (value, record) => {
        const matches = data.filter((item: FirmwareItem) =>
          [record.apeSig, record.apeSig25, record.apeSig3].includes(
            item.signature
          )
        );

        return (
          <>
            {matches.length > 0 &&
              matches.map((match: FirmwareItem) => (
                <Button
                  key={match.firmwareVersion}
                  type="link"
                  href={match.downloadUrl}
                  className="flex"
                >
                  {match.firmwareVersion}
                </Button>
              ))}
          </>
        );
      },
    },
  ];

  return (
    <>
      <Row className="flex justify-between gap-4 mb-4">
        <Menu
          mode="horizontal"
          className="rounded-lg"
          defaultSelectedKeys={["4"]}
          items={items}
          onClick={({ key }) => {
            // search inside children of each item too for href of this key
            const url =
              items.find((item) => item.key === key)?.href ||
              items
                .find((item) =>
                  item.children?.find((child) => child.key === key)
                )
                ?.children?.find((child) => child.key === key)?.href;

            if (url) window.open(url, "_self");
          }}
        />
        <div className="flex">
          <Input
            size="large"
            placeholder="Search firmware..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Row>
      <Table
        className="overflow-auto"
        dataSource={filteredData}
        columns={columns}
        rowKey={(record) => record.signature}
        expandable={{
          expandedRowRender: (record) => (
            <pre>{JSON.stringify(record, null, 2)}</pre>
          ),
        }}
      />
    </>
  );
}

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between mt-12 p-4 lg:px-24 ${inter.className}`}
    >
      <div className="my-3 z-10 w-full max-w-5xl items-center justify-end font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full items-center justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          <span>Consider sponsoring Lunars on</span>
          <Button type="link" className="flex pl-2 -my-2">
            <Link target="_blank" href="https://github.com/sponsors/Lunars">
              <code className="font-mono font-bold flex items-center space-x-1">
                <span>Github</span>
                <FaExternalLinkAlt className="inline" />
              </code>
            </Link>
          </Button>
        </p>
      </div>

      <FirmwareTable />
    </main>
  );
}
