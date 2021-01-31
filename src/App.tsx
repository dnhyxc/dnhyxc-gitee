import React from 'react';
import { Button, Input } from 'antd';
import icon from '@/assets/image/img1.jpg';
import styles from './App.less';

const App: React.FC = () => {
  return (
    <div className={styles.App}>
      <img src={icon} alt="logo" />
      <div>
        <Button type="primary">Btn</Button>
        <Input placeholder="请输入" />
      </div>
    </div>
  )
}

export default App;