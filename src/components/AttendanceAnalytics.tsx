import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AttendanceAnalyticsProps {
  darkMode: boolean;
}

// Mock attendance analytics by committee
const committeeData = [
  {
    committee: 'Programs Committee',
    members: 15,
    present: 12,
    late: 2,
    absent: 1,
    excused: 0,
    presentNames: ['Juan Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia', 'Carlos Martinez', 'Sofia Lopez', 'Miguel Torres', 'Isabella Gonzalez', 'Diego Fernandez', 'Camila Rodriguez', 'Luis Sanchez', 'Elena Ramirez'],
    lateNames: ['Roberto Diaz', 'Patricia Morales'],
    absentNames: ['Fernando Castro']
  },
  {
    committee: 'Logistics Committee',
    members: 12,
    present: 10,
    late: 1,
    absent: 1,
    excused: 0,
    presentNames: ['Jose Rivera', 'Carmen Flores', 'Antonio Vargas', 'Lucia Mendoza', 'Francisco Jimenez', 'Rosa Ortiz', 'Manuel Silva', 'Teresa Perez', 'Alberto Ramos', 'Gloria Gutierrez'],
    lateNames: ['Ricardo Mendez'],
    absentNames: ['Beatriz Torres']
  },
  {
    committee: 'Media Committee',
    members: 10,
    present: 9,
    late: 0,
    absent: 0,
    excused: 1,
    presentNames: ['Gabriel Santos', 'Daniela Cruz', 'Sebastian Reyes', 'Valentina Garcia', 'Mateo Lopez', 'Victoria Martinez', 'Lucas Fernandez', 'Emma Rodriguez', 'Nicolas Sanchez'],
    lateNames: [],
    excusedNames: ['Olivia Diaz']
  },
  {
    committee: 'Finance Committee',
    members: 8,
    present: 6,
    late: 1,
    absent: 1,
    excused: 0,
    presentNames: ['Benjamin Morales', 'Mia Castro', 'Alexander Rivera', 'Sophia Flores', 'Ethan Vargas', 'Ava Mendoza'],
    lateNames: ['James Jimenez'],
    absentNames: ['Charlotte Ortiz']
  }
];

const COLORS = {
  Present: '#4ade80',
  Late: '#fbbf24',
  Absent: '#f87171',
  Excused: '#60a5fa'
};

export default function AttendanceAnalytics({ darkMode }: AttendanceAnalyticsProps) {
  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="ysp-card mb-6">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-2">Attendance Analytics by Committee</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Detailed breakdown of attendance for General Assembly - October 2024
        </p>
      </div>

      <div className="space-y-6">
        {committeeData.map((committee, index) => {
          const chartData = [
            { name: 'Present', value: committee.present },
            { name: 'Late', value: committee.late },
            { name: 'Absent', value: committee.absent },
            { name: 'Excused', value: committee.excused }
          ].filter(item => item.value > 0);

          return (
            <div key={index} className="ysp-card">
              <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">{committee.committee}</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-green-400" />
                      <span>Present ({committee.present})</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                      {committee.presentNames.join(', ')}
                    </div>
                  </div>

                  {committee.late > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-400" />
                        <span>Late ({committee.late})</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                        {committee.lateNames.join(', ')}
                      </div>
                    </div>
                  )}

                  {committee.absent > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full bg-red-400" />
                        <span>Absent ({committee.absent})</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                        {committee.absentNames.join(', ')}
                      </div>
                    </div>
                  )}

                  {committee.excused > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full bg-blue-400" />
                        <span>Excused ({committee.excused})</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                        {committee.excusedNames ? committee.excusedNames.join(', ') : ''}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg">
                    <span>Total Members: {committee.members}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
