import React, { useState } from 'react';
import { Button, Layout, Menu, theme, Dropdown, Space } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UploadOutlined, UserOutlined, VideoCameraOutlined, LogoutOutlined } from '@ant-design/icons';
import TableStudent from './TableStudent';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { auth } from './FireBaseConfig';
import { getAuth, signOut } from 'firebase/auth';
import { DemoLine } from './DemoLine';
import { useEffect } from 'react';
import {  onAuthStateChanged } from 'firebase/auth';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('1');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName);
      } else {
        navigate('/login'); // Redirect to login if no user is found
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);

      // Perform any additional logout actions here
      setIsLoggedIn(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Handle sign-out error
    }
  };
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleNavClick = (navKey) => {
    setActiveNav(navKey); // Update the active navigation state
    // Add your logic here to handle the navigation content
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" mode="inline" selectedKeys={[activeNav]}>
          <Menu.Item key="1" icon={<UserOutlined />} className="menu-item" onClick={() => handleNavClick('1')}>
            Nav 1
          </Menu.Item>
          <Menu.Item key="2" icon={<VideoCameraOutlined />} className="menu-item" onClick={() => handleNavClick('2')}>
            Nav 2
          </Menu.Item>
          <Menu.Item key="3" icon={<UploadOutlined />} className="menu-item" onClick={() => handleNavClick('3')}>
            Nav 3
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {isLoggedIn && <span style={{ marginRight: '16px' }}>Welcome back, {userName}!</span>}
              {isLoggedIn && (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <Button type="text" icon={<UserOutlined />} style={{ fontSize: '16px' }} />
                </Dropdown>
              )}
            </div>
          </div>
        </Header>

        <Content className="site-layout-background" style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>

          {activeNav === '1' && <div><TableStudent lecturerName={userName}/></div>}
          {activeNav === '2' && <div><DemoLine /></div>}
          {activeNav === '3' && <div>Content for Nav 3</div>}
        </Content>

      </Layout>
    </Layout>
  );
};

export default Dashboard;
