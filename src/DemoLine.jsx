import { Line } from '@ant-design/plots';
import React, { useState, useEffect } from 'react';
import GradeDistributionPie from './GradeDistributionPie';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './FireBaseConfig';
import { getGrade } from './GradeDistributionPie';
import ModelAccuracyTrend from './ModelAccuracyTrend';

export const DemoLine = () => {
  const [assessmentAverages, setAssessmentAverages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedCourses, setSubmittedCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

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
        setSelectedCourses(courses); // Initially select all courses
        await fetchAssessmentAverages(lecturerName, courses);
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

  const fetchAssessmentAverages = async (lecturerName, selectedCourses) => {
    try {
      const db = getFirestore(app);
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);

      const assessmentTotals = {};
      const assessmentCounts = {};

      for (const userDoc of usersSnapshot.docs) {
        const coursesCollectionRef = collection(userDoc.ref, 'courses');
        const coursesSnapshot = await getDocs(coursesCollectionRef);

        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          if (selectedCourses.includes(courseData.courseCode)) {
            const assessments = courseData.assessments ? courseData.assessments : [];
            assessments.forEach(assessment => {
              const { assessmentType, score } = assessment;
              if (assessmentType && typeof score === 'number') {
                assessmentTotals[assessmentType] = (assessmentTotals[assessmentType] || 0) + score;
                assessmentCounts[assessmentType] = (assessmentCounts[assessmentType] || 0) + 1;
              }
            });
          }
        }
      }

      const averageScores = {};
      for (const assessmentType in assessmentTotals) {
        averageScores[assessmentType] = assessmentTotals[assessmentType] / assessmentCounts[assessmentType];
      }

      setAssessmentAverages(averageScores);
      console.log("Assessment Averages:", averageScores);
    } catch (error) {
      console.error("Error fetching assessment averages: ", error);
      setError("An error occurred while fetching assessment averages.");
    }
  };

  const handleCourseChange = async (event) => {
    const courseCode = event.target.value;
    const isChecked = event.target.checked;

    let newSelectedCourses;
    if (isChecked) {
      newSelectedCourses = [...selectedCourses, courseCode];
    } else {
      newSelectedCourses = selectedCourses.filter(code => code !== courseCode);
    }

    setSelectedCourses(newSelectedCourses);
    await fetchAssessmentAverages(null, newSelectedCourses);
  };

  const config = {
    data: Object.entries(assessmentAverages).map(([assessment, score]) => ({ assessment, score })),
    xField: 'assessment',
    yField: 'score',
    point: {
      shape: 'square',
      size: 4,
    },
    tooltip: {
      formatter: (data) => {
        const grade = getGrade(data.score);
        return { name: data.assessment, value: `${data.score} (${grade})` };
      },
    },
    style: {
      lineWidth: 2,
    },
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (submittedCourses.length === 0) return <div>No courses found.</div>;

  return (
    <>
      <div>
        <h3>Select Courses:</h3>
        {submittedCourses.map(course => (
          <label key={course}>
            <input
              type="checkbox"
              value={course}
              checked={selectedCourses.includes(course)}
              onChange={handleCourseChange}
            />
            {course}
          </label>
        ))}
      </div>
      {selectedCourses.length > 0 ? (
        <>
          <Line {...config} />
          <GradeDistributionPie />
          <ModelAccuracyTrend />
        </>
      ) : (
        <div>Please select at least one course.</div>
      )}
    </>
  );
};

export default DemoLine;