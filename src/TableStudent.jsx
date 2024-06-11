import React, {useEffect, useState} from 'react';
import { Space, Table, Tag, Button, Typography, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';
import { app } from './FireBaseConfig';
import { getFirestore, collection, query, where, getDocs, addDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Modal, Input } from 'antd';


import { useLocation } from 'react-router-dom';

const { Text } = Typography;

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
    } else if (key === 'Advice') {
      const uniqueGrades = [...new Set(data.map(item => {
        const grade = getGrade(Math.round(parseFloat(item['Predicted Final Grade'])));
        return grade;
      }))];
      const uniqueMessages = [...new Set(uniqueGrades.map(getMessageForGrade))];

      column.filters = [
        ...uniqueGrades.map(grade => ({ text: grade, value: grade })),
        ...uniqueMessages.map(message => ({ text: message, value: message }))
      ];
      column.onFilter = (value, record) => {
        const grade = getGrade(Math.round(parseFloat(record['Predicted Final Grade'])));
        const message = getMessageForGrade(grade);
        return grade === value || message === value;
      };
    } else {
      // Add filters for other columns
      const uniqueValues = [...new Set(data.map(item => item[key]))];
      column.filters = uniqueValues.map(value => ({ text: value, value }));
      column.onFilter = (value, record) => record[key] === value;
    }

    return column;
  });

  return columns.filter((column) => column !== null);
};
const sendMessage = (record) => {
  // if (!record || !record['Course Code']) {
  //   console.error('Record or Course Code is undefined:', record);
  //   Modal.error({
  //     title: 'Error',
  //     content: 'Course Code is missing or invalid.',
  //   });
  //   return;
  // }
  Modal.confirm({
    title: 'Send Message',
    content: (
      <div>
        <Input.TextArea rows={4} placeholder="Enter your message here..." id="messageContent" />
      </div>
    ),
    onOk: async () => {
      const messageContent = document.getElementById('messageContent').value;
      if (messageContent) {
        const db = getFirestore(app);
        try {

          console.log('record', record);
          const messagesCollectionRef = collection(db, 'messages');

          await addDoc(messagesCollectionRef, {
            message: messageContent,
            timestamp: new Date(),
            from: 'lecturer', // or use the lecturer's name or ID
            courseCode: record.courseCode,
            userId:  record.userId
          });

          Modal.success({
            title: 'Message sent successfully',
          });
        } catch (error) {
          Modal.error({
            title: 'Error sending message',
            content: error.message,
          });
        }
      } else {
        Modal.error({
          title: 'Message cannot be empty',
        });
      }
    }
  });
};

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

const getMessageForGrade = (grade, record, sendMessage) => {
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

  const message = gradeMessages[grade] || 'N/A';
  const color = getGradeColor(grade);

  if (message === 'Need Attention') {
    return (
      <Space>
        <Tag color={color}>{grade}</Tag>
        <Tag color={color} onClick={sendMessage} style={{ cursor: 'pointer' }}>
          {message}
        </Tag>
      </Space>
    );
  }

  return (
    <Space>
      <Tag color={color}>{grade}</Tag>
      <Tag color={color}>{message}</Tag>
    </Space>
  );
};

const getGradeColor = (grade) => {
  switch (grade) {
    case 'A':
    case 'A-':
    case 'B+':
    case 'B':
    case 'B-':
      return 'green';
    case 'C+':
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


const TableStudent = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [submittedCourses, setSubmittedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lecturerName = user.displayName;
        await fetchSubmittedCourses(lecturerName);
      } else {
        setError("User not authenticated.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSubmittedCourses = async (lecturerName) => {
    setIsLoading(true);
    setError(null);

    try {
      const db = getFirestore(app);
      const lecturersCollectionRef = collection(db, "lecturers");
      const lecturerQuery = query(lecturersCollectionRef, where("name", "==", lecturerName));
      const lecturerSnapshot = await getDocs(lecturerQuery);

      if (!lecturerSnapshot.empty) {
        const lecturerDoc = lecturerSnapshot.docs[0];
        const lecturerData = lecturerDoc.data();
        const courses = lecturerData.courses || [];
        setSubmittedCourses(courses);
        await fetchStudentData(courses);
      } else {
        setError(`No lecturer found with the name "${lecturerName}".`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching submitted courses: ", error);
      setError("An error occurred while fetching submitted courses.");
      setIsLoading(false);
    }
  };

  const fetchStudentData = async (submittedCourses) => {
    try {
      const db = getFirestore(app);
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);
  
      const coursesData = [];
  
      for (const userDoc of usersSnapshot.docs) {
        const coursesCollectionRef = collection(userDoc.ref, 'courses');
        const coursesSnapshot = await getDocs(coursesCollectionRef);
  
        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          const userName = userDoc.data().name;
          const userId = userDoc.id; // Get userId
          const grade = getGrade(Math.round(courseData.predictedScore));
          const color = getGradeColor(grade);
          const message = getMessageForGrade(grade, { userId, ...courseData }, ()=>sendMessage({...courseDoc.data(),userId:userId})); 
  
          if (submittedCourses.includes(courseData.courseCode)) {
            const assessments = courseData.assessments ? courseData.assessments : [];
            const selectedData = {
              "Course Code": courseData.courseCode,
              "Course Type": courseData.courseType,
              "Predicted Final Grade": (courseData.predictedScore || 0).toFixed(2),
              "Predicted Final Exam": (courseData.predictedFinal || 0).toFixed(2),
              "Coursework": courseData.coursework,
              "Assessments": assessments,
              Name: userName,
              "Advice": message, 
            };
            coursesData.push(selectedData);
          }
        }
      }
  
      setData(coursesData);
      setColumns(generateColumns(coursesData));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching student data: ", error);
      setError("An error occurred while fetching student data.");
      setIsLoading(false);
    }
  };

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;
  return (
    <div>
      {/* {data.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Text>No data available for the submitted courses</Text>
          <br />
          <Button type="primary" onClick={() => navigate('/UpdateProfile')}>
            Update Profile
          </Button>
        </div>
      ) : (
        <>
          <Table columns={columns} dataSource={data} />
        </>
      )} */}
      <Flex vertical justify='center' gap={20}>
      <Table columns={columns} dataSource={data} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button type="primary" onClick={() => navigate('/UpdateProfile')}>
              Update Courses
            </Button>
          </div>
      </Flex>

    </div>
  );
};

export default TableStudent;
