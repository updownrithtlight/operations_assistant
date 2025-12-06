import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppRouter } from './router';

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;