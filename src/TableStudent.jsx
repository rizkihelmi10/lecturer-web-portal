import React, {useEffect, useState} from 'react';
import { Space, Table, Tag } from 'antd';
import { useNavigate } from'react-router-dom';
import { app } from './FireBaseConfig';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { map } from '@ant-design/plots/es/core/utils';

const generateColumns = (data) => {
  if (!data.length) return [];

  const sampleRecord = data[0];
  const columns = Object.keys(sampleRecord).map((key) => {
    if (key === 'key') return null;

    const column = {
      title: key.charAt(0).toUpperCase() + key.slice(1),
      dataIndex: key,
      key,
    };

    if (key === 'Assessments') {
      column.render = (assessments) => (
        <>
          {Array.isArray(assessments) &&
            assessments.map((assessment, index) => (
              <div key={index}>
                <span>
                  <Tag color="cyan"> {assessment.assessmentType}: {assessment.score} ({assessment.percentage}%)</Tag>
                </span>
              </div>
            ))}
        </>
      );
    }

    return column;
  });

  return columns.filter((column) => column !== null);
}

// Helper functions
const getGrade = (score) => {
  const combine_grade_mapping = {
    '80-100': 'A',
    '70-79': 'A-',
    '64-69': 'B+',
    '58-63': 'B',
    '52-57': 'B-',
    '46-51': 'C+',
    '40-45': 'C',
    '36-39': 'C-',
    '32-35': 'D+',
    '28-31': 'D',
    '25-27': 'D-',
    '0-24': 'F',
  };

  for (const [range, grade] of Object.entries(combine_grade_mapping)) {
    const [min, max] = range.split('-').map(Number);
    if (score >= min && score <= max) {
      return grade;
    }
  }
  return 'N/A';
};
const getGradeColor = (grade) => {
  switch (grade) {
    case 'A':
    case 'A-':
    case 'B+':
    case 'B':
      return 'green';
    case 'C+':
      return 'darkgreen';
    case 'C':
    case 'C-':
    case 'D+':
    case 'D':
    case 'D-':
    case 'F':
      return 'red';
    default:
      return 'black';
  }
};
const getMessageForGrade = (grade) => {
  const gradeMessages = {
    'A': 'Good',
    'A-': 'Good',
    'B+': 'Good',
    'B': 'Good',
    'B-': 'Good',
    'C+': 'Need Attention',
    'C': 'Need Attention',
    'C-': 'Need Attention',
    'D+': 'Need Attention',
    'D': 'Need Attention',
    'D-': 'Need Attention',
    'F': 'Need Attention',
  };

  return gradeMessages[grade] || 'N/A';
};


const TableStudent = ({ lecturerName }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  console.log(lecturerName);
 

  useEffect(() => {
    const fetchData = async () => {
      
      const db = getFirestore(app);
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);
  
      const coursesData = [];
  
      for (const userDoc of usersSnapshot.docs) {
        const coursesCollectionRef = collection(userDoc.ref, 'courses');
        const coursesSnapshot = await getDocs(coursesCollectionRef);
  
        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          const lecturerNames = courseData.lecturerName;
          const userName = userDoc.data().name;
          const grade = getGrade(Math.round(courseData.predictedScore));
          const color = getGradeColor(grade);
          const message = getMessageForGrade(grade);
  
          if (lecturerNames.toLowerCase().includes(lecturerName.toLowerCase())) {
            const assessments = courseData.assessments ? courseData.assessments : [];
            const selectedData = {
              "Course Code": courseData.courseCode,
              "Course Type": courseData.courseType,
              "Predicted Final Grade": (courseData.predictedScore || 0).toFixed(2),
              "Predicted Final Exam": (courseData.predictedFinal || 0).toFixed(2),
              "Coursework": courseData.coursework,
              "Assessments": assessments,
              Name: userName,
              "Advice": (
                <Space>
                  <Tag color={color}>{grade}</Tag>
                  <Tag color={color}>{message}</Tag>
                </Space>
              )
            };
            coursesData.push(selectedData);
          }
        }
      }
      console.log(lecturerName);
      setData(coursesData);
      setColumns(generateColumns(coursesData));
      console.log(coursesData);
      console.log(columns);
      
    };
  
    fetchData();
  }, [lecturerName]);
  return <Table columns={columns} dataSource={data} />;
};
export default TableStudent;