import React, { useState, useEffect } from 'react';
import { Select, Input, Button, Table, Typography, message } from 'antd';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './FireBaseConfig';

const { Option } = Select;
const { Text } = Typography;

const ModelEvaluation = () => {
  const [submittedCourses, setSubmittedCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentCourses, setStudentCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lecturerName, setLecturerName] = useState('');
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const name = user.displayName;
        setLecturerName(name);
        setUserData(user);
        await fetchSubmittedCourses(name);
      } else {
        setError("User not authenticated.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  console.log(userData);

  const fetchSubmittedCourses = async (lecturerName) => {
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
        await fetchStudents(courses);
      } else {
        setError(`No lecturer found with the name "${lecturerName}".`);
      }
    } catch (error) {
      console.error("Error fetching submitted courses: ", error);
      setError("An error occurred while fetching submitted courses.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (courses) => {
    try {
      const db = getFirestore(app);
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);

      const studentList = [];
      for (const userDoc of usersSnapshot.docs) {
        const coursesCollectionRef = collection(userDoc.ref, 'courses');
        const coursesSnapshot = await getDocs(coursesCollectionRef);

        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          if (courses.includes(courseData.courseCode)) {
            studentList.push({ id: userDoc.id, name: userDoc.data().name });
            break;
          }
        }
      }
      setStudents(studentList);
    } catch (error) {
      console.error("Error fetching students: ", error);
      setError("An error occurred while fetching students.");
    }
  };

  const handleCourseChange = async (courseCode) => {
    setSelectedCourse(courseCode);
    try {
      const db = getFirestore(app);
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);

      const studentCourses = [];
      for (const userDoc of usersSnapshot.docs) {
        const coursesCollectionRef = collection(userDoc.ref, 'courses');
        const coursesSnapshot = await getDocs(coursesCollectionRef);

        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          if (courseData.courseCode === courseCode) {
            studentCourses.push({
              ...courseData,
              id: courseDoc.id,
              studentId: userDoc.id,
              studentName: userDoc.data().name,
              actualGrade: '',
            });
          }
        }
      }

      setStudentCourses(studentCourses);
    } catch (error) {
      console.error("Error fetching student courses: ", error);
      setError("An error occurred while fetching student courses.");
    }
  };

  const handleGradeChange = (courseId, value) => {
    setStudentCourses(prev =>
      prev.map(course =>
        course.id === courseId ? { ...course, actualGrade: value } : course
      )
    );
  };

  const calculateAndSaveAccuracy = async () => {
    let totalError = 0;
    let count = 0;

    studentCourses.forEach(course => {
      if (course.actualGrade !== '') {
        const predictedGrade = course.predictedScore;
        const actualGrade = parseFloat(course.actualGrade);
        totalError += Math.abs(predictedGrade - actualGrade);
        count++;
      }
    });

    if (count === 0) {
      message.warning("Please enter at least one actual grade.");
      return;
    }

    const meanAbsoluteError = totalError / count;
    const accuracy = 100 - meanAbsoluteError;

    try {
        const db = getFirestore(app);
        const modelAccuracyCollectionRef = collection(db, "modelAccuracy");
    
        const modelAccuracyDoc = await addDoc(modelAccuracyCollectionRef, {
          accuracy: accuracy,
          lastUpdated: new Date(),
          lecturerId: userData.uid,
        });
    
        message.success(`Model accuracy updated: ${accuracy.toFixed(2)}%`);
      } catch (error) {
        console.error("Error saving model accuracy: ", error);
        message.error("An error occurred while saving model accuracy.");
      }
  };

  const columns = [
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Course Code', dataIndex: 'courseCode', key: 'courseCode' },
    { title: 'Predicted Grade', dataIndex: 'predictedScore', key: 'predictedScore', render: val => val.toFixed(2) },
    {
      title: 'Actual Grade',
      dataIndex: 'actualGrade',
      key: 'actualGrade',
      render: (val, record) => (
        <Input
          value={val}
          onChange={e => handleGradeChange(record.id, e.target.value)}
          type="number"
          step="0.01"
        />
      ),
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>Model Evaluation</h1>
      <Select
        style={{ width: '100%', marginBottom: 20 }}
        placeholder="Select a course"
        onChange={handleCourseChange}
      >
        {submittedCourses.map(course => (
          <Option key={course} value={course}>{course}</Option>
        ))}
      </Select>

      {selectedCourse && (
        <>
          <Table
            dataSource={studentCourses}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
          <Button
            type="primary"
            onClick={calculateAndSaveAccuracy}
            style={{ marginTop: 20 }}
          >
            Calculate and Save Model Accuracy
          </Button>
        </>
      )}
    </div>
  );
};

export default ModelEvaluation;
