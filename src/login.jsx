import React from "react";
import { Button, Checkbox, Form, Input, message } from "antd";
import "./Login.css";
import studentImage from './student.png';
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./FireBaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { email, password } = values;
  
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful', email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error, email, password);
      message.error('Invalid credentials. Please try again.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("Invalid credentials. Please try again.");
  };

  return (
    <div className="login-container">
      <div className="image-container">
        <img src={studentImage} alt="Login" className="login-image" />
      </div>
      <div className="form-container">
        <Form
          name="login"
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
            remember: true,
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
                message: "Please input your email!",
              },
              {
                type: 'email',
                message: 'Please enter a valid email address!',
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
                message: "Please input your password!",
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
              Login
            </Button>
          </Form.Item>
        </Form>
        <div className="signup-link" onClick={() => navigate('/signup')}>
  Don't have an account? <Button type="primary" htmlType="submit">
              Sign Up
            </Button>
</div>
      </div>
    </div>
  );
};

export default Login;
