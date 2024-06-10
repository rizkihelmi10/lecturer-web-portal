import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, Space, Typography, Divider, Layout } from 'antd';
import { app } from './FireBaseConfig';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { Title } = Typography;
const { Header, Content } = Layout;

const layout = {
  labelCol: {
    span: 12,
  },
  wrapperCol: {
    span: 16,
  },
};

const tailLayout = {
  wrapperCol: {
    offset: 12,
    span: 12,
  },
};

const UpdateProfile = () => {
  const [form] = Form.useForm();
  const [numCourses, setNumCourses] = useState(0);
  const navigate = useNavigate();

  const onNumCoursesChange = (value) => {
    setNumCourses(value);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        form.setFieldsValue({ name: user.displayName });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [form]);

  const onFinish = async (values) => {
    const { name, ...courses } = values;
  
    try {
      const db = getFirestore(app);
      const lecturerCollectionRef = collection(db, "lecturers");
  
      const q = query(lecturerCollectionRef, where("name", "==", name));
      const querySnapshot = await getDocs(q);
  
      let submittedCourses = Object.values(courses);
  
      if (!querySnapshot.empty) {
        const existingLecturerDoc = querySnapshot.docs[0];
        const lecturerId = existingLecturerDoc.id;
        await updateDoc(doc(db, "lecturers", lecturerId), {
          courses: submittedCourses,
        });
        console.log("Lecturer data updated successfully");
      } else {
        const newLecturerDoc = await addDoc(lecturerCollectionRef, {
          name,
          courses: submittedCourses,
        });
        console.log("New lecturer data saved successfully");
        console.log("Submitted Courses:", submittedCourses);
      }
  
      navigate('/dashboard', { state: { submittedCourses } });
    } catch (error) {
      console.error("Error saving lecturer data: ", error);
    }
  };
  
  const onReset = () => {
    form.resetFields();
    setNumCourses(0);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor: '#137e53', padding: 0 }}>
        <Title level={2} style={{ color: 'white', textAlign: 'center', margin: '16px 0' }}>
          Update Profile
        </Title>
      </Header>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
        <div style={{ display: 'flex', background: 'white', padding: '100px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
          <Form
            {...layout}
            form={form}
            name="control-hooks"
            onFinish={onFinish}
            style={{
              maxWidth: 600,
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="numCourses"
              label="Number of Courses Taught"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                placeholder="Select number of courses"
                onChange={onNumCoursesChange}
                allowClear
              >
                {[...Array(5).keys()].map((num) => (
                  <Option key={num + 1} value={num + 1}>
                    {num + 1}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {[...Array(numCourses).keys()].map((num) => (
              <Form.Item
                key={num}
                name={`course${num + 1}`}
                label={`Course Code ${num + 1}`}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            ))}

            <Form.Item {...tailLayout}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                <Button htmlType="button" onClick={onReset}>
                  Reset
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default UpdateProfile;
