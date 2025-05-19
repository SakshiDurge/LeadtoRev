// File: src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

const App = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('india');
  const [historicalData, setHistoricalData] = useState(null);
  const [stats, setStats] = useState({ cases: 0, recovered: 0, deaths: 0 });

  useEffect(() => {
    axios.get('https://restcountries.com/v3.1/all')
      .then(res => {
        const countryList = res.data.map(country => ({
          name: country.name.common,
          code: (country.cca2 || country.cca3 || country.name.common).toLowerCase()
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
      })
      .catch(err => {
        console.error('Error fetching countries:', err);
      });
  }, []);

  useEffect(() => {
    if (!selectedCountry) return;

    axios
      .get(`https://disease.sh/v3/covid-19/historical/${selectedCountry}?lastdays=1500`)
      .then(res => {
        const timeline = res.data.timeline || res.data;
        if (timeline?.cases && timeline?.recovered && timeline?.deaths) {
          setHistoricalData(timeline);
          const caseValues = Object.values(timeline.cases);
          const recValues = Object.values(timeline.recovered);
          const deathValues = Object.values(timeline.deaths);

          setStats({
            cases: caseValues[caseValues.length - 1] || 0,
            recovered: recValues[recValues.length - 1] || 0,
            deaths: deathValues[deathValues.length - 1] || 0,
          });
        } else {
          console.warn('Invalid timeline data for:', selectedCountry);
          setHistoricalData(null);
          setStats({ cases: 0, recovered: 0, deaths: 0 });
        }
      })
      .catch(err => {
        console.error('Error fetching historical data:', err);
        setHistoricalData(null);
        setStats({ cases: 0, recovered: 0, deaths: 0 });
      });
  }, [selectedCountry]);

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
  };

  const getLineChartData = () => {
    if (!historicalData) return {};
    const labels = Object.keys(historicalData.cases || {});
    return {
      labels,
      datasets: [
        {
          label: 'Cases',
          data: Object.values(historicalData.cases || {}),
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Recovered',
          data: Object.values(historicalData.recovered || {}),
          borderColor: 'green',
          fill: false,
        },
        {
          label: 'Deaths',
          data: Object.values(historicalData.deaths || {}),
          borderColor: 'red',
          fill: false,
        },
      ],
    };
  };

  const getPieChartData = () => {
    const { cases, recovered, deaths } = stats;
    const totalPopulation = 1400000000;
    const active = cases - recovered - deaths;
    const remaining = totalPopulation - (cases || 0);
    return {
      labels: ['Recovered', 'Deaths', 'Active Cases', 'Remaining Population'],
      datasets: [
        {
          data: [recovered, deaths, active > 0 ? active : 0, remaining],
          backgroundColor: ['green', 'red', 'blue', 'khaki'],
        },
      ],
    };
  };

  return (
    <div className="dashboard-box">
      <h1>COVID-19 Dashboard</h1>

      <div className="top-bar">
        <select onChange={handleCountryChange} value={selectedCountry}>
          {countries.map((c, index) => (
            <option key={index} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="cards">
        <div className="card blue">
          <h2>Cases</h2>
          <p>{(stats.cases / 1e6).toFixed(1)}M</p>
        </div>
        <div className="card green">
          <h2>Recovered</h2>
          <p>{(stats.recovered / 1e6).toFixed(1)}M</p>
        </div>
        <div className="card red">
          <h2>Deaths</h2>
          <p>{(stats.deaths / 1e6).toFixed(1)}M</p>
        </div>
      </div>

      {historicalData ? (
        <div className="charts">
          <div className="chart">
            <h3>Cases Over Time</h3>
            <Line data={getLineChartData()} />
          </div>
          <div className="chart">
            <h3>Population Impact</h3>
            <Pie data={getPieChartData()} />
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center', marginTop: '30px' }}>Loading chart data or no data available.</p>
      )}
    </div>
  );
};

export default App;