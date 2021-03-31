import React, { useEffect, useState } from 'react';
import {BarChart, Bar, CartesianGrid, Legend, Tooltip, XAxis, YAxis} from 'recharts';

const MARS_API_KEY = "fAWxzeqUa1euI9ZmAxgjRLpkxe7vtHuUY7mWQdB7";
const MARS_API_URL = `https://api.nasa.gov/insight_weather/?api_key=${MARS_API_KEY}&feedtype=json&ver=1.0`;
const EARTH_API_KEY = "c36a14608329afdecc380aa66f1994bb";

const getWeatherAPIUrl = function(date) {
    return `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=33.4484&lon=-112.0740&dt=${new Date(date) * 1 / 1000}&appid=${EARTH_API_KEY}`;
}

export default function Page() {
    const [solData, setSolData] = useState([]);
    const [earthDateData, setEarthDateData] = useState([]);
    const [showEarthData, setShowEarthData] = useState(true);
    useEffect(() => {
        fetch(MARS_API_URL).then((res) => {
            res.json().then((data) => {
                const arrayData = [];
                for (const sol of data.sol_keys) {
                    const obj = data[sol];
                    obj.sol = sol;
                    arrayData.push(data[sol]);
                    fetch(getWeatherAPIUrl(obj.First_UTC)).then((earthRes) => {
                        earthRes.json().then((earthData) => {
                            console.log(earthData.hourly);
                            const averagePressure = earthData.hourly.reduce((acc, val) => acc + val.pressure, 0) / earthData.hourly.length;
                            const preObject = {
                                pressure: averagePressure,
                                sol,
                            };
                            setEarthDateData((pressureData) => {
                                return pressureData.concat([preObject]).sort((a, b) => {
                                    return a.sol - b.sol;
                                });
                            });
                        }).catch((err) => {
                            console.error(err);
                        })
                    }).catch((err) => {
                        console.error(err);
                    });
                }
                setSolData(arrayData.sort((a, b) => a.sol - b.sol));
            }).catch((err) => {
                console.error(err);
            });
        }).catch((err) => {
            console.error(err);
        });
    }, []);

    if (solData.length === 0 || earthDateData.length === 0 || solData.length > earthDateData.length) {
        return <div>
            Loading...
        </div>
    } else {
        const data = [];
        for (const sol of solData) {
            data.push({
                name: "Sol #" + sol.sol,
                Mars: sol.PRE.av,
                Earth: earthDateData.find((data) => data.sol === sol.sol).pressure * 100, // Convert hPa to Pa
            });
        }
        return (<div>
            <h1>Mars vs Earth Barometric Pressure</h1>
            <p>The chart below shows the latest average barometric pressure on Mars from NASA's InSight API. This data is then compared to the average barometric pressure in Phoenix, Arizona on the corresponding Earth day that took place on the same Martian sol. All units are in Pa.</p>
            <BarChart width={800} height={600} data={data} className="chart">
                <CartesianGrid />
                <XAxis dataKey="name" />
                <YAxis scale={showEarthData ? "sqrt" : "linear"} domain={[dataMin => showEarthData ? 0 : dataMin * 9/10, 'dataMax']} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Mars" fill="#cc0000" />
                {showEarthData ? <Bar dataKey="Earth" fill="#0000cc" /> : "" }
            </BarChart>
            Show Earth Data: <input type="checkbox" checked={showEarthData} onChange={(e) => setShowEarthData(!showEarthData)} />
        </div>)
    }
}
