// GradeDistributionPie.js
import React, { useEffect, useState } from 'react';
import { Pie } from '@ant-design/plots';
import { app } from './FireBaseConfig';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Helper functions (copy these from TableStudent.js)
export const getGrade = (score) => {
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
const GradeDistributionPie = () => {
  const [gradeDistribution, setGradeDistribution] = useState({ needAttention: 0, good: 0 });
  const [lecturer, setLecturer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lecturerName = user.displayName;
        await fetchLecturerData(lecturerName);
      } else {
        setError("User not authenticated.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchLecturerData = async (name) => {
    setIsLoading(true);
    setError(null);

    try {
      const db = getFirestore(app);
      const lecturersCollectionRef = collection(db, "lecturers");

      // Query for the lecturer with the given name
      const q = query(lecturersCollectionRef, where("name", "==", name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const lecturerDoc = querySnapshot.docs[0];
        const lecturerData = {
          id: lecturerDoc.id,
          ...lecturerDoc.data()
        };
        setLecturer(lecturerData);
        console.log("Fetched Lecturer Data:", lecturerData);
        await fetchGradeDistribution(lecturerData.courses || []);
      } else {
        setError(`No lecturer found with the name "${name}".`);
      }
    } catch (error) {
      console.error("Error fetching lecturer data: ", error);
      setError("An error occurred while fetching lecturer data.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGradeDistribution = async (submittedCourses) => {
    try {
      const db = getFirestore(app);
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);

      let needAttention = 0;
      let good = 0;

      for (const userDoc of usersSnapshot.docs) {
        const coursesCollectionRef = collection(userDoc.ref, 'courses');
        const coursesSnapshot = await getDocs(coursesCollectionRef);

        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          const grade = getGrade(Math.round(courseData.predictedScore));
          const message = getMessageForGrade(grade);

          if (submittedCourses.includes(courseData.courseCode)) {
            if (message === 'Need Attention') {
              needAttention++;
            } else if (message === 'Good') {
              good++;
            }
          }
        }
      }
      setGradeDistribution({ needAttention, good });
    } catch (error) {
      console.error("Error fetching grade distribution: ", error);
      setError("An error occurred while fetching grade distribution.");
    }
  };

   const config = {
    data: [
      { type: 'Need Attention', value: gradeDistribution.needAttention },
      { type: 'Good', value: gradeDistribution.good },
    ],
    angleField: 'value',
    colorField: 'type',
    color: ['#ff4d4f', '#52c41a'], // Red for 'Need Attention', Green for 'Good'
    legend: {
      layout: 'horizontal',
      position: 'bottom',
    },
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: `Need Attention: ${gradeDistribution.needAttention}\nGood: ${gradeDistribution.good}`,
      },
    },
  };


  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!lecturer) return <div>No lecturer data available.</div>;

  return (
    <div style={{ marginBottom: '20px' }}>
      <h2>Grade Distribution</h2>
      <Pie {...config} />
    </div>
  );
};

export default GradeDistributionPie;