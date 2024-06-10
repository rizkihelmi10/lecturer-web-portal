import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './FireBaseConfig';

const ModelAccuracyTrend = () => {
  const [accuracyData, setAccuracyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState([]);


  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lecturerName = user.displayName;
        setUserData(user);
        await fetchAccuracyData(lecturerName);
      } else {
        setError("User not authenticated.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAccuracyData = async (lecturerName) => {
    setIsLoading(true);
    setError(null);
  
    try {
      const db = getFirestore(app);
      const modelAccuracyCollectionRef = collection(db, "modelAccuracy");
      
      // Modify the query
      const accuracyQuery = query(
        modelAccuracyCollectionRef, 
        where("uid", "==", userData.uid),
        orderBy("timestamp", "asc")
      );
  
      console.log("Fetching accuracy data for lecturer:", lecturerName);
      const accuracySnapshot = await getDocs(accuracyQuery);
  
      if (!accuracySnapshot.empty) {
        const accuracyEntries = accuracySnapshot.docs.map((doc, index) => {
          const data = doc.data();
          return {
            index: index + 1,
            accuracy: data.accuracy,
            timestamp: data.timestamp.toDate().toLocaleDateString(),
          };
        });
        setAccuracyData(accuracyEntries);
        console.log("Accuracy Data:", accuracyEntries);
      } else {
        setError(`No accuracy data found for lecturer "${lecturerName}".`);
      }
    } catch (error) {
      console.error("Error fetching accuracy data: ", error);
      setError(`An error occurred while fetching accuracy data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const config = {
    data: accuracyData,
    xField: 'index',
    yField: 'accuracy',
    point: {
      shape: 'circle',
      size: 5,
    },
    tooltip: {
      formatter: (data) => ({
        name: 'Accuracy',
        value: `${data.accuracy.toFixed(2)}% (${data.timestamp})`,
      }),
    },
    style: {
      lineWidth: 2,
    },
    xAxis: {
      title: { text: 'Evaluation Index' },
    },
    yAxis: {
      title: { text: 'Model Accuracy (%)' },
      min: 0,
      max: 100,
    },
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (accuracyData.length === 0) return <div>No accuracy data available for this lecturer.</div>;

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>Model Accuracy Trend</h1>
      <Line {...config} />
    </div>
  );
};

export default ModelAccuracyTrend;