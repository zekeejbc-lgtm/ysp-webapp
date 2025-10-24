import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';

interface AttendanceTransparencyProps {
  darkMode: boolean;
  currentUser: any;
}

// Mock attendance records
const mockAttendanceRecords = [
  { date: '2024-10-15', event: 'General Assembly - October 2024', timeIn: 'Present - 2:00 PM', timeOut: 'Present - 5:00 PM', status: 'Present' },
  { date: '2024-10-10', event: 'Community Clean-Up Drive', timeIn: 'Present - 8:00 AM', timeOut: 'Present - 12:00 PM', status: 'Present' },
  { date: '2024-10-05', event: 'Tree Planting Activity', timeIn: 'Late - 9:15 AM', timeOut: 'Present - 1:00 PM', status: 'Late' },
  { date: '2024-09-28', event: 'Leadership Training Workshop', timeIn: 'Present - 1:00 PM', timeOut: 'Present - 6:00 PM', status: 'Present' },
  { date: '2024-09-20', event: 'Monthly General Meeting', timeIn: 'Present - 3:00 PM', timeOut: 'Present - 5:00 PM', status: 'Present' },
  { date: '2024-09-15', event: 'Volunteer Orientation', timeIn: 'Excused', timeOut: '-', status: 'Excused' },
  { date: '2024-09-08', event: 'Outreach Program', timeIn: 'Present - 7:00 AM', timeOut: 'Present - 4:00 PM', status: 'Present' }
];

export default function AttendanceTransparency({ darkMode, currentUser }: AttendanceTransparencyProps) {
  if (!currentUser) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'text-green-600 dark:text-green-400';
      case 'Late':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Absent':
        return 'text-red-600 dark:text-red-400';
      case 'Excused':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="ysp-card mb-6">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-2">Attendance Transparency</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Viewing attendance records for: <span className="text-[#f6421f] dark:text-[#ee8724]">{currentUser.fullName}</span> ({currentUser.idCode})
        </p>
      </div>

      <div className="ysp-card">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAttendanceRecords.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.event}</TableCell>
                  <TableCell>{record.timeIn}</TableCell>
                  <TableCell>{record.timeOut}</TableCell>
                  <TableCell className={getStatusColor(record.status)}>
                    {record.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
            <p className="text-2xl text-green-600 dark:text-green-400">5</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
            <p className="text-2xl text-yellow-600 dark:text-yellow-400">1</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
            <p className="text-2xl text-red-600 dark:text-red-400">0</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Excused</p>
            <p className="text-2xl text-blue-600 dark:text-blue-400">1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
