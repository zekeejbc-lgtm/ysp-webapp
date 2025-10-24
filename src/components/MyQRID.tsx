import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, IdCard } from 'lucide-react';

interface MyQRIDProps {
  darkMode: boolean;
  currentUser: any;
}

export default function MyQRID({ darkMode, currentUser }: MyQRIDProps) {
  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="ysp-card text-center">
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-6">My QR ID</h2>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg inline-block shadow-lg mb-6">
          <QRCodeSVG
            value={currentUser.idCode}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={24} className="text-[#f6421f]" />
            <div className="text-left">
              <p className="text-sm text-gray-500">Full Name</p>
              <p>{currentUser.fullName}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <IdCard size={24} className="text-[#f6421f]" />
            <div className="text-left">
              <p className="text-sm text-gray-500">ID Code</p>
              <p>{currentUser.idCode}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <User size={24} className="text-[#f6421f]" />
            <div className="text-left">
              <p className="text-sm text-gray-500">Position</p>
              <p>{currentUser.position}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Present this QR code during events for attendance recording
          </p>
        </div>
      </div>
    </div>
  );
}
