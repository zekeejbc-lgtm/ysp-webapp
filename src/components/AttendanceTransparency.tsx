import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';

interface AttendanceTransparencyProps {
  darkMode: boolean;
  currentUser: any;
}

interface AttendanceRecord {
  date: string;
  eventName: string;
  timeIn: string;
  timeOut: string;
  status: string;
}

interface StatusCounts {
  present: number;
  late: number;
  absent: number;
  excused: number;
}

export default function AttendanceTransparency({ currentUser }: AttendanceTransparencyProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    present: 0,
    late: 0,
    absent: 0,
    excused: 0
  });

  useEffect(() => {
    console.log('AttendanceTransparency mounted. CurrentUser:', currentUser);
    if (currentUser) {
      console.log('CurrentUser ID:', currentUser.id);
      if (currentUser.id) {
        fetchAttendance();
      } else {
        console.error('CurrentUser has no ID!');
        setIsLoading(false);
      }
    } else {
      console.error('No currentUser!');
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching attendance for ID:', currentUser.id);
      
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getUserAttendance',
          idCode: currentUser.id
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Result:', result);

      if (result.success) {
        if (result.records && result.records.length > 0) {
          setRecords(result.records);
          calculateStatusCounts(result.records);
        } else {
          // No records found, but request was successful
          setRecords([]);
          setStatusCounts({ present: 0, late: 0, absent: 0, excused: 0 });
        }
      } else {
        console.error('Failed to load:', result.message);
        toast.error(result.message || 'Failed to load attendance records');
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Unable to load attendance records');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatusCounts = (attendanceRecords: AttendanceRecord[]) => {
    const counts: StatusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    attendanceRecords.forEach(record => {
      const status = record.status.toLowerCase();
      if (status === 'present') counts.present++;
      else if (status === 'late') counts.late++;
      else if (status === 'absent') counts.absent++;
      else if (status === 'excused') counts.excused++;
    });

    setStatusCounts(counts);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'text-green-600 dark:text-green-400 font-medium';
      case 'late':
        return 'text-yellow-600 dark:text-yellow-400 font-medium';
      case 'absent':
        return 'text-red-600 dark:text-red-400 font-medium';
      case 'excused':
        return 'text-blue-600 dark:text-blue-400 font-medium';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="ysp-card mb-6">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-2">Attendance Transparency</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Viewing attendance records for: <span className="font-semibold text-gray-900 dark:text-white">({currentUser.id})</span>
        </p>
      </div>

      <div className="ysp-card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#f6421f] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading attendance records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No attendance records found.</p>
          </div>
        ) : (
          <>
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
                  {records.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.eventName}</TableCell>
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
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{statusCounts.present}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.late}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-200 dark:border-red-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{statusCounts.absent}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Excused</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.excused}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
