import React from 'react';
import { Button, Checkbox, Form, Input, message } from 'antd';
import './SignUp.css'; 
import studentImage from './student.png';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './FireBaseConfig';
import { useNavigate } from 'react-router-dom';





const SignUp = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { email, password, name } = values;

    try {
      // Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, { displayName: name });

      console.log('Sign up successful!', name);
      message.success('Sign up successful!');
      navigate('/'); // Navigate to the dashboard after successful sign-up
    } catch (error) {
      console.error('Sign up error:', error);
      message.error('Sign up failed. Please try again.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };return (
    <div className="signup-container">
    <div className="image-container">
      <img src={studentImage} alt="Sign Up" className="signup-image" />
    </div>
    <div className="form-container">
      <Form
        name="basic"
        labelCol={{
          span: 8,
        }}
        wrapperCol={{
          span: 16,
        }}
        style={{
          maxWidth: 600,
        }}
        initialValues={{
          remember: false,
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your email!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[
            {
              required: true,
              message: 'Please input your name!',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="remember"
          valuePropName="checked"
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button type="primary" htmlType="submit">
            Sign Up
          </Button>
        </Form.Item>
      </Form>
    </div>
  </div>
  );
 
};

export default SignUp;
