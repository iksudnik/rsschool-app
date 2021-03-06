import { Button, Checkbox, Form, Row, Col, Input, Layout, message, Radio, Select, Table } from 'antd';
import { AdminSider, Header, Session, withSession } from 'components';
import { boolIconRenderer, stringSorter, tagsRenderer } from 'components/Table';
import { union } from 'lodash';
import { useCallback, useState } from 'react';
import { useAsync } from 'react-use';
import { Task, TaskService } from 'services/task';
import { githubRepoUrl, urlPattern } from 'services/validators';
import { ModalForm } from 'components/Forms';

const { Content } = Layout;
type Props = { session: Session };
const service = new TaskService();

function Page(props: Props) {
  const [data, setData] = useState([] as Task[]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState(null as Partial<Task> | null);
  const [modalAction, setModalAction] = useState('update');
  const [modalValues, setModalValues] = useState<any>({});

  useAsync(async () => {
    const tasks = await service.getTasks();
    setData(tasks);
  }, []);

  const handleAddItem = () => {
    setModalData({});
    setModalAction('create');
  };

  const handleEditItem = (record: Task) => {
    setModalData(record);
    setModalAction('update');
  };

  const handleModalSubmit = useCallback(
    async (values: any) => {
      try {
        if (modalLoading) {
          return;
        }
        setModalLoading(true);
        const record = createRecord(values);
        const item =
          modalAction === 'update'
            ? await service.updateTask(modalData!.id!, record)
            : await service.createTask(record);
        const updatedData =
          modalAction === 'update' ? data.map(d => (d.id === item.id ? { ...d, ...item } : d)) : data.concat([item]);

        setData(updatedData);
        setModalData(null);
      } catch (e) {
        message.error('An error occurred. Please try again later.');
      } finally {
        setModalLoading(false);
      }
    },
    [modalData, modalAction, modalLoading],
  );

  const renderModal = useCallback(() => {
    const isAutoTask = (modalValues.verification || modalData?.verification) === 'auto';
    const type = modalValues.type || modalData?.type;
    const isCodingTask = type === 'jstask' || type === 'kotlintask' || type === 'objctask';
    const allTags = union(...data.map(d => d.tags || []));
    return (
      <ModalForm
        data={modalData}
        title="Task"
        submit={handleModalSubmit}
        cancel={() => setModalData(null)}
        onChange={setModalValues}
        getInitialValues={getInitialValues}
        loading={modalLoading}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter task name' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Task Type" rules={[{ required: true, message: 'Please select a type' }]}>
              <Select>
                <Select.Option value="jstask">JS task</Select.Option>
                <Select.Option value="kotlintask">Kotlin task</Select.Option>
                <Select.Option value="objctask">ObjC task</Select.Option>
                <Select.Option value="htmltask">HTML task</Select.Option>
                <Select.Option value="htmlcssacademy">HTML/CSS Academy</Select.Option>
                <Select.Option value="cv:markdown">CV Markdown</Select.Option>
                <Select.Option value="cv:html">CV HTML</Select.Option>
                <Select.Option value="codewars:stage1">Codewars stage 1</Select.Option>
                <Select.Option value="codewars:stage2">Codewars stage 2</Select.Option>
                <Select.Option value="test">Test</Select.Option>
                <Select.Option value="codejam">Code Jam</Select.Option>
                <Select.Option value="interview">Interview</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="tags" label="Tags">
          <Select mode="tags">
            {allTags.map(tag => (
              <Select.Option key={tag} value={tag}>
                {tag}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="descriptionUrl"
          label="Description URL"
          rules={[
            {
              required: true,
              message: 'Please enter description URL',
            },
            {
              message: 'Please enter valid URL',
              pattern: urlPattern,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="verification" label="Verification">
              <Radio.Group>
                <Radio value="manual">Manual</Radio>
                <Radio value="auto">Auto</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="githubPrRequired" label="Github" valuePropName="checked">
              <Checkbox>Github Pull Request required</Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="githubRepoName" label="Expected Github Repo Name">
          <Input disabled={!isAutoTask} />
        </Form.Item>
        <Form.Item
          name="sourceGithubRepoUrl"
          label="Source Github Repo Url"
          rules={
            isAutoTask && isCodingTask
              ? [{ required: true, message: 'Please enter Github Repo Url', pattern: githubRepoUrl }]
              : []
          }
        >
          <Input disabled={!(isAutoTask && isCodingTask)} />
        </Form.Item>
      </ModalForm>
    );
  }, [modalData, modalValues, modalLoading, handleModalSubmit]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminSider isAdmin={props.session.isAdmin} />
      <Layout style={{ background: '#fff' }}>
        <Header title="Manage Tasks" username={props.session.githubId} />
        <Content style={{ margin: 8 }}>
          <Button type="primary" onClick={handleAddItem}>
            Add Task
          </Button>
          <Table
            size="small"
            style={{ marginTop: 8 }}
            dataSource={data}
            pagination={{ pageSize: 100 }}
            rowKey="id"
            columns={getColumns(handleEditItem)}
          />
        </Content>
      </Layout>
      {renderModal()}
    </Layout>
  );
}

function createRecord(values: any) {
  const data: Partial<Task> = {
    type: values.type,
    name: values.name,
    verification: values.verification,
    githubPrRequired: !!values.githubPrRequired,
    descriptionUrl: values.descriptionUrl,
    githubRepoName: values.githubRepoName,
    sourceGithubRepoUrl: values.sourceGithubRepoUrl,
    tags: values.tags,
  };
  return data;
}

function getColumns(handleEditItem: any) {
  return [
    {
      title: 'Id',
      dataIndex: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: stringSorter<Task>('name'),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: tagsRenderer,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      sorter: stringSorter<Task>('type'),
    },
    {
      title: 'Description URL',
      dataIndex: 'descriptionUrl',
      render: (value: string) =>
        value ? (
          <a title={value} href={value}>
            Link
          </a>
        ) : null,
      width: 80,
    },
    {
      title: 'PR Required',
      dataIndex: 'githubPrRequired',
      render: boolIconRenderer,
      width: 80,
    },
    {
      title: 'Repo Name',
      dataIndex: 'githubRepoName',
    },
    {
      title: 'Verification',
      dataIndex: 'verification',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_: any, record: Task) => <a onClick={() => handleEditItem(record)}>Edit</a>,
    },
  ];
}

function getInitialValues(modalData: Partial<Task>) {
  return {
    ...modalData,
    verification: modalData.verification || 'manual',
  };
}

export default withSession(Page);
