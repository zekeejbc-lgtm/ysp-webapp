import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Check, Copy, AlertCircle, Heart, Users, TrendingUp, Share2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import tabangLogo from 'figma:asset/b18a9cbbd9dce503cafdf70882144244fc9e4845.png';
import Breadcrumb from './design-system/Breadcrumb';
import PaymentMethodModal, { PaymentMethod } from './PaymentMethodModal';

interface Campaign {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string;
  qrCodes: {
    gcash?: string;
    maya?: string;
    gotyme?: string;
  };
  endDate: string;
}

interface CampaignDonation {
  id: number;
  campaignId: number;
  name: string;
  amount: number;
  date: string;
  status: 'pending' | 'acknowledged' | 'invalid' | 'rejected';
  receiptUrl?: string;
  email?: string;
  rejectionReason?: string;
}

interface TabangTaBaiPageProps {
  onClose: () => void;
  isAdmin: boolean;
  isDark: boolean;
  userRole?: 'admin' | 'auditor' | 'member';
}

export default function TabangTaBaiPage({ onClose, isAdmin, isDark, userRole = 'member' }: TabangTaBaiPageProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [copiedQR, setCopiedQR] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<PaymentMethod | null>(null);

  // Real data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'gcash',
      name: 'GCash',
      accountName: 'Youth Service Philippines - Tagum',
      accountNumber: '09123456789',
      qrCode: '',
      instructions: '1. Open your GCash app\n2. Scan the QR code or enter the mobile number\n3. Enter your donation amount\n4. Complete the payment\n5. Take a screenshot of the receipt\n6. Upload it below to complete your donation'
    },
    {
      id: 'maya',
      name: 'Maya',
      accountName: 'Youth Service Philippines - Tagum',
      accountNumber: '09987654321',
      qrCode: '',
      instructions: '1. Open your Maya app\n2. Scan the QR code or enter the mobile number\n3. Enter your donation amount\n4. Complete the payment\n5. Take a screenshot of the receipt\n6. Upload it below to complete your donation'
    },
    {
      id: 'gotyme',
      name: 'GoTyme Bank',
      accountName: 'Youth Service Philippines - Tagum',
      accountNumber: '09111222333',
      qrCode: '',
      instructions: '1. Open your GoTyme app\n2. Scan the QR code or enter the mobile number\n3. Enter your donation amount\n4. Complete the payment\n5. Take a screenshot of the receipt\n6. Upload it below to complete your donation'
    }
  ]);

  // Fetch data from GAS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const gasApi = await import('../services/gasApi');

        // Fetch Campaigns
        const campaignsResult = await gasApi.getDonationCampaignsFromGAS();
        if (campaignsResult.success && Array.isArray(campaignsResult.campaigns)) {
          const mappedCampaigns = campaignsResult.campaigns.map((c: any) => ({
            id: parseInt(c.id) || 0,
            title: c.name || '',
            description: c.description || '',
            goalAmount: parseFloat(c.targetAmount) || 0,
            currentAmount: parseFloat(c.currentAmount) || 0,
            imageUrl: c.imageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
            qrCodes: {}, // Will be populated from settings if needed, or just use global payment methods
            endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : ''
          }));
          setCampaigns(mappedCampaigns);
        }

        // Fetch Donations
        const donationsResult = await gasApi.getDonationsFromGAS();
        if (donationsResult.success && Array.isArray(donationsResult.donations)) {
          const mappedDonations = donationsResult.donations.map((d: any) => ({
            id: parseInt(d.id) || 0,
            campaignId: parseInt(d.campaign) || 0, // Assuming campaign column stores ID
            name: d.donorName || 'Anonymous',
            amount: parseFloat(d.amount) || 0,
            date: d.timestamp ? new Date(d.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: (d.status?.toLowerCase() === 'verified' ? 'acknowledged' : d.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as any,
            receiptUrl: d.receiptUrl,
            email: d.contact // Assuming contact column stores email
          }));
          setDonations(mappedDonations);
        }

        // Fetch Settings (Payment Methods)
        const settingsResult = await gasApi.getDonationSettingsFromGAS();
        if (settingsResult.success && Array.isArray(settingsResult.settings)) {
          const newPaymentMethods = [...paymentMethods];
          settingsResult.settings.forEach((setting: any) => {
            const methodIndex = newPaymentMethods.findIndex(pm => pm.id === setting.method?.toLowerCase());
            if (methodIndex !== -1) {
              if (setting.qrImageUrl) newPaymentMethods[methodIndex].qrCode = setting.qrImageUrl;
              if (setting.accountName) newPaymentMethods[methodIndex].accountName = setting.accountName;
              // Account number might be in a different field or parsed from account name/desc
            }
          });
          setPaymentMethods(newPaymentMethods);
        }

      } catch (error) {
        console.error("Error fetching TabangTaBai data:", error);
      }
    };

    fetchData();
  }, []);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size too large', {
          description: 'Please upload an image smaller than 10MB'
        });
        return;
      }
      if (!file.type.match(/image\/(png|jpg|jpeg)/)) {
        toast.error('Invalid file type', {
          description: 'Please upload a PNG or JPG image'
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        toast.success('Receipt uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDonationSubmit = () => {
    if (!selectedCampaign) return;

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid donation amount'
      });
      return;
    }
    if (!receiptImage) {
      toast.error('Receipt required', {
        description: 'Please upload your payment receipt'
      });
      return;
    }
    if (!donorEmail || !donorEmail.includes('@')) {
      toast.error('Valid email required', {
        description: 'Please enter a valid email address for confirmation'
      });
      return;
    }

    const newDonation: CampaignDonation = {
      id: donations.length + 1,
      campaignId: selectedCampaign.id,
      name: donorName || 'Anonymous',
      amount: parseFloat(donationAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      receiptUrl: receiptImage,
      email: donorEmail
    };

    setDonations([newDonation, ...donations]);
    toast.success('Donation submitted!', {
      description: 'Thank you for your support. Your donation is pending verification.'
    });

    // Reset form
    setDonorName('');
    setDonorEmail('');
    setDonationAmount('');
    setReceiptImage(null);
    setShowDonationForm(false);
  };

  const handleDonationAction = (donationId: number, action: 'acknowledged' | 'invalid' | 'rejected', reason?: string) => {
    const donation = donations.find(d => d.id === donationId);
    if (!donation) return;

    const updatedDonations = donations.map(d =>
      d.id === donationId
        ? { ...d, status: action, rejectionReason: reason }
        : d
    );
    setDonations(updatedDonations);

    // Simulate sending email
    if (action === 'acknowledged') {
      toast.success('Donation acknowledged!', {
        description: `Thank you email sent to ${donation.email}`
      });
      console.log(`Email sent to ${donation.email}: Thank you for your generous donation of ₱${donation.amount}!`);
    } else if (action === 'invalid') {
      toast.info('More proof requested', {
        description: `Email sent to ${donation.email} requesting additional verification`
      });
      console.log(`Email sent to ${donation.email}: We need additional proof for your donation. Please provide a clearer receipt.`);
    } else if (action === 'rejected') {
      toast.error('Donation rejected', {
        description: `Refund notice sent to ${donation.email}`
      });
      console.log(`Email sent to ${donation.email}: Your donation has been rejected. Reason: ${reason}. Full refund will be processed.`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedQR(label);
          toast.success('Copied!', {
            description: `${label} number copied to clipboard`
          });
          setTimeout(() => setCopiedQR(null), 2000);
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopyTextToClipboard(text, label);
        });
    } else {
      // Use fallback for older browsers
      fallbackCopyTextToClipboard(text, label);
    }
  };

  const fallbackCopyTextToClipboard = (text: string, label: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedQR(label);
        toast.success('Copied!', {
          description: `${label} number copied to clipboard`
        });
        setTimeout(() => setCopiedQR(null), 2000);
      } else {
        toast.error('Copy failed', {
          description: `Please manually copy: ${text}`
        });
      }
    } catch (err) {
      document.body.removeChild(textArea);
      toast.error('Copy failed', {
        description: `Please manually copy: ${text}`
      });
    }
  };

  const handleShare = (campaign: Campaign, platform: 'facebook' | 'messenger' | 'instagram') => {
    const shareText = `Help support: ${campaign.title}\n\nGoal: ₱${campaign.goalAmount.toLocaleString()}\nRaised: ₱${campaign.currentAmount.toLocaleString()}\n\nDonate now and make a difference! 🙏❤️`;
    const shareUrl = window.location.href;

    let url = '';
    if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
      toast.success('Opening share dialog...');
    } else if (platform === 'messenger') {
      url = `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank');
      toast.success('Opening share dialog...');
    } else if (platform === 'instagram') {
      // Instagram doesn't have direct share URL, so we copy to clipboard
      const fullText = shareText + '\n' + shareUrl;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText)
          .then(() => {
            toast.success('Copied to clipboard!', {
              description: 'Share this in your Instagram story or post'
            });
          })
          .catch(() => {
            fallbackCopyForShare(fullText);
          });
      } else {
        fallbackCopyForShare(fullText);
      }
    }
  };

  const fallbackCopyForShare = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success('Copied to clipboard!', {
          description: 'Share this in your Instagram story or post'
        });
      } else {
        toast.error('Copy failed', {
          description: 'Please manually copy the campaign link'
        });
      }
    } catch (err) {
      document.body.removeChild(textArea);
      toast.error('Copy failed', {
        description: 'Please manually copy the campaign link'
      });
    }
  };

  const getProgress = (campaign: Campaign) => {
    return Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
  };

  const getCampaignDonations = (campaignId: number) => {
    return donations.filter(d => d.campaignId === campaignId);
  };

  const getAcknowledgedDonors = (campaignId: number) => {
    return donations.filter(d => d.campaignId === campaignId && d.status === 'acknowledged');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} relative overflow-hidden`} style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
      {/* Animated Background Blobs - Same as Homepage */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/40 dark:bg-orange-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-200/40 dark:bg-yellow-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-200/40 dark:bg-red-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-pink-200/40 dark:bg-pink-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-6000" />
      </div>

      {/* Glassmorphism Header - Matching Feedback Center */}
      <header
        className="fixed top-4 left-4 right-4 z-50 h-16 rounded-2xl border shadow-2xl transition-all duration-300"
        style={{
          background: isDark
            ? 'rgba(17, 24, 39, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
          boxShadow: isDark
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
            : '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(238, 135, 36, 0.15), rgba(246, 66, 31, 0.15))',
              border: '2px solid rgba(238, 135, 36, 0.3)',
              color: '#ee8724',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Title Section - Centered with Logo */}
          <div className="flex-1 flex items-center justify-center gap-2 md:gap-3 min-w-0">
            <img
              src={tabangLogo}
              alt="Tabang Ta Bai Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain flex-shrink-0"
              style={{
                background: 'transparent',
                mixBlendMode: isDark ? 'normal' : 'multiply',
                filter: isDark ? 'brightness(1.1)' : 'none'
              }}
            />
            <div className="text-center min-w-0">
              <h1
                className="text-base sm:text-lg md:text-xl lg:text-2xl truncate"
                style={{
                  fontFamily: 'var(--font-headings)',
                  fontWeight: 'var(--font-weight-bold)',
                  letterSpacing: '-0.02em',
                  color: isDark ? '#fb923c' : '#ea580c',
                  lineHeight: '1.2'
                }}
              >
                Tabang Ta Bai
              </h1>
              <p className={`text-xs hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontWeight: '500', lineHeight: '1.2' }}>
                Campaigns for Community
              </p>
            </div>
          </div>

          {/* Spacer for balance */}
          <div className="w-20 sm:w-24 flex-shrink-0" />
        </div>
      </header>

      {/* Add top padding to account for fixed header */}
      <div className="h-24" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Home", onClick: onClose },
            { label: "Tabang Ta Bai!", onClick: undefined },
          ]}
          isDark={isDark}
        />

        {/* Hero Section */}
        <div
          className="rounded-3xl p-8 sm:p-12 mb-8 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(246, 66, 31, 0.15) 0%, rgba(238, 135, 36, 0.15) 50%, rgba(251, 203, 41, 0.15) 100%)',
            border: '2px solid rgba(238, 135, 36, 0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(246, 66, 31, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(251, 203, 41, 0.3) 0%, transparent 50%)`,
            }} />
          </div>

          <div className="relative z-10">
            <Heart className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            <h2
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 'var(--font-weight-bold)',
                letterSpacing: '-0.02em',
                color: isDark ? '#fff' : '#1e293b'
              }}
            >
              Together, We Make a Difference
            </h2>
            <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontWeight: '500' }}>
              Join us in transforming lives through your generosity. Every donation counts, every share matters.
              <span className={`block mt-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} style={{ fontWeight: '600' }}>"Tabang ta bai" - Let's help each other!</span>
            </p>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const progress = getProgress(campaign);
            const acknowledgedDonors = getAcknowledgedDonors(campaign.id);
            const campaignDonations = getCampaignDonations(campaign.id);

            return (
              <div
                key={campaign.id}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
                  border: isDark ? '2px solid rgba(238, 135, 36, 0.2)' : '2px solid rgba(238, 135, 36, 0.3)',
                  boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Campaign Image */}
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Goal Badge */}
                  <div
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #f6421f 0%, #ee8724 100%)',
                      color: 'white',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    Goal: ₱{campaign.goalAmount.toLocaleString()}
                  </div>
                </div>

                {/* Campaign Content */}
                <div className="p-5">
                  <h3
                    style={{
                      fontFamily: 'var(--font-headings)',
                      fontSize: '1.25rem',
                      fontWeight: 'var(--font-weight-bold)',
                      color: isDark ? '#fff' : '#1e293b'
                    }}
                  >
                    {campaign.title}
                  </h3>
                  <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontWeight: '500' }}>
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'} style={{ fontWeight: '600' }}>Progress</span>
                      <span className={isDark ? 'text-orange-400' : 'text-orange-600'} style={{ fontWeight: '700' }}>{progress.toFixed(0)}%</span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden"
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        border: isDark ? '1px solid rgba(238, 135, 36, 0.2)' : '1px solid rgba(238, 135, 36, 0.3)'
                      }}
                    >
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #f6421f 0%, #ee8724 50%, #fbcb29 100%)',
                          boxShadow: '0 0 10px rgba(238, 135, 36, 0.5)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span style={{ fontWeight: '700', color: isDark ? '#fff' : '#1e293b' }}>₱{campaign.currentAmount.toLocaleString()}</span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'} style={{ fontWeight: '600' }}>of ₱{campaign.goalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4">
                    <div
                      className="flex-1 p-2 rounded-lg text-center"
                      style={{
                        background: 'rgba(238, 135, 36, 0.1)',
                        border: isDark ? '1px solid rgba(238, 135, 36, 0.2)' : '1px solid rgba(238, 135, 36, 0.3)'
                      }}
                    >
                      <Users className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      <p className="text-xs" style={{ fontWeight: '700', color: isDark ? '#fff' : '#1e293b' }}>{acknowledgedDonors.length}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontWeight: '500' }}>Donors</p>
                    </div>
                    <div
                      className="flex-1 p-2 rounded-lg text-center"
                      style={{
                        background: 'rgba(238, 135, 36, 0.1)',
                        border: isDark ? '1px solid rgba(238, 135, 36, 0.2)' : '1px solid rgba(238, 135, 36, 0.3)'
                      }}
                    >
                      <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      <p className="text-xs" style={{ fontWeight: '700', color: isDark ? '#fff' : '#1e293b' }}>
                        {((campaign.currentAmount / campaign.goalAmount) * 100).toFixed(0)}%
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontWeight: '500' }}>Funded</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowDonationForm(true);
                      }}
                      className="w-full py-3 rounded-xl text-white transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #f6421f 0%, #ee8724 100%)',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(246, 66, 31, 0.4)'
                      }}
                    >
                      <Heart className="w-5 h-5" />
                      Donate Now
                    </button>

                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="w-full py-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(238, 135, 36, 0.15)',
                        border: '2px solid rgba(238, 135, 36, 0.3)',
                        color: '#ee8724',
                        fontWeight: '600'
                      }}
                    >
                      View Details
                    </button>
                  </div>

                  {/* Share Buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleShare(campaign, 'facebook')}
                      className="flex-1 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
                      style={{
                        background: 'rgba(59, 89, 152, 0.2)',
                        border: '1px solid rgba(59, 89, 152, 0.4)',
                        color: '#7c9cdb'
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare(campaign, 'messenger')}
                      className="flex-1 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
                      style={{
                        background: 'rgba(0, 132, 255, 0.2)',
                        border: '1px solid rgba(0, 132, 255, 0.4)',
                        color: '#5db3ff'
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                      Messenger
                    </button>
                    <button
                      onClick={() => handleShare(campaign, 'instagram')}
                      className="flex-1 py-2 rounded-lg text-xs transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
                      style={{
                        background: 'rgba(193, 53, 132, 0.2)',
                        border: '1px solid rgba(193, 53, 132, 0.4)',
                        color: '#e96fb3'
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                      Instagram
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && !showDonationForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease]"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            overflowY: 'auto'
          }}
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="relative w-full max-w-4xl my-auto rounded-2xl overflow-hidden animate-[scaleIn_0.3s_ease]"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
              border: '2px solid rgba(238, 135, 36, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-xl transition-all duration-300 hover:rotate-90 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(238, 135, 36, 0.3)',
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Campaign Image */}
            <div className="relative h-64 sm:h-80 overflow-hidden">
              <ImageWithFallback
                src={selectedCampaign.imageUrl}
                alt={selectedCampaign.title}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 100%)'
                }}
              />
            </div>

            <div className="p-6 sm:p-8">
              <h2
                className="text-white mb-4"
                style={{
                  fontFamily: 'var(--font-headings)',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                {selectedCampaign.title}
              </h2>
              <p className="text-gray-300 mb-6" style={{ fontWeight: '500' }}>
                {selectedCampaign.description}
              </p>

              {/* Progress Section */}
              <div
                className="p-5 rounded-xl mb-6"
                style={{
                  background: 'rgba(238, 135, 36, 0.1)',
                  border: '2px solid rgba(238, 135, 36, 0.2)'
                }}
              >
                <div className="flex justify-between mb-3">
                  <span className="text-white" style={{ fontWeight: '700' }}>₱{selectedCampaign.currentAmount.toLocaleString()}</span>
                  <span className="text-gray-400" style={{ fontWeight: '600' }}>raised of ₱{selectedCampaign.goalAmount.toLocaleString()}</span>
                </div>
                <div
                  className="h-4 rounded-full overflow-hidden mb-2"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${getProgress(selectedCampaign)}%`,
                      background: 'linear-gradient(90deg, #f6421f 0%, #ee8724 50%, #fbcb29 100%)',
                      boxShadow: '0 0 10px rgba(238, 135, 36, 0.5)'
                    }}
                  />
                </div>
                <p className="text-orange-400 text-sm" style={{ fontWeight: '700' }}>
                  {getProgress(selectedCampaign).toFixed(0)}% funded
                </p>
              </div>

              {/* Donors List */}
              <div className="mb-6">
                <h3 className="text-white mb-3" style={{ fontWeight: '700' }}>
                  Recent Donors ({getAcknowledgedDonors(selectedCampaign.id).length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getAcknowledgedDonors(selectedCampaign.id).length > 0 ? (
                    getAcknowledgedDonors(selectedCampaign.id).map((donor) => (
                      <div
                        key={donor.id}
                        className="p-3 rounded-lg flex justify-between items-center"
                        style={{
                          background: 'rgba(238, 135, 36, 0.1)',
                          border: '1px solid rgba(238, 135, 36, 0.2)'
                        }}
                      >
                        <span className="text-white" style={{ fontWeight: '600' }}>{donor.name}</span>
                        <span className="text-orange-400" style={{ fontWeight: '700' }}>₱{donor.amount.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4" style={{ fontWeight: '500' }}>
                      Be the first to donate!
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Panel - Pending Donations */}
              {isAdmin && getCampaignDonations(selectedCampaign.id).some(d => d.status === 'pending') && (
                <div className="mb-6">
                  <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontWeight: '700' }}>
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    Pending Donations ({getCampaignDonations(selectedCampaign.id).filter(d => d.status === 'pending').length})
                  </h3>
                  <div className="space-y-3">
                    {getCampaignDonations(selectedCampaign.id)
                      .filter(d => d.status === 'pending')
                      .map((donation) => (
                        <div
                          key={donation.id}
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(251, 203, 41, 0.1)',
                            border: '2px solid rgba(251, 203, 41, 0.3)'
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-white" style={{ fontWeight: '700' }}>{donation.name}</p>
                              <p className="text-gray-400 text-sm" style={{ fontWeight: '500' }}>{donation.email}</p>
                              <p className="text-orange-400 text-sm" style={{ fontWeight: '600' }}>₱{donation.amount.toLocaleString()}</p>
                            </div>
                            {donation.receiptUrl && (
                              <a
                                href={donation.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg text-xs transition-all duration-300 hover:scale-105"
                                style={{
                                  background: 'rgba(238, 135, 36, 0.2)',
                                  border: '1px solid rgba(238, 135, 36, 0.3)',
                                  color: '#ee8724',
                                  fontWeight: '600'
                                }}
                              >
                                View Receipt
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDonationAction(donation.id, 'acknowledged')}
                              className="flex-1 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1"
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                fontWeight: '600'
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Acknowledge
                            </button>
                            <button
                              onClick={() => handleDonationAction(donation.id, 'invalid')}
                              className="flex-1 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1"
                              style={{
                                background: 'rgba(251, 203, 41, 0.2)',
                                border: '1px solid rgba(251, 203, 41, 0.4)',
                                color: '#fbcb29',
                                fontWeight: '600'
                              }}
                            >
                              <Mail className="w-4 h-4" />
                              Invalid
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleDonationAction(donation.id, 'rejected', reason);
                                }
                              }}
                              className="flex-1 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#ef4444',
                                fontWeight: '600'
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Donate Button */}
              <button
                onClick={() => setShowDonationForm(true)}
                className="w-full py-4 rounded-xl text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #f6421f 0%, #ee8724 100%)',
                  fontWeight: '700',
                  fontSize: '1.125rem',
                  boxShadow: '0 8px 20px rgba(246, 66, 31, 0.4)'
                }}
              >
                <Heart className="w-6 h-6" />
                Make a Donation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Form Modal */}
      {showDonationForm && selectedCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease]"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            overflowY: 'auto'
          }}
          onClick={() => {
            setShowDonationForm(false);
            setReceiptImage(null);
            setDonorName('');
            setDonorEmail('');
            setDonationAmount('');
          }}
        >
          <div
            className="relative w-full max-w-2xl my-auto rounded-2xl overflow-hidden animate-[scaleIn_0.3s_ease]"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
              border: '2px solid rgba(238, 135, 36, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowDonationForm(false);
                setReceiptImage(null);
                setDonorName('');
                setDonorEmail('');
                setDonationAmount('');
              }}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-xl transition-all duration-300 hover:rotate-90 active:scale-95"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(238, 135, 36, 0.3)',
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="p-6 sm:p-8">
              <h2
                className="text-white mb-2"
                style={{
                  fontFamily: 'var(--font-headings)',
                  fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                Make a Donation
              </h2>
              <p className="text-gray-400 mb-6" style={{ fontWeight: '500' }}>
                Supporting: {selectedCampaign.title}
              </p>

              {/* QR Codes Section */}
              <div className="mb-6">
                <h3 className="text-white mb-3" style={{ fontWeight: '700' }}>
                  Payment Options
                </h3>
                <p className="text-gray-300 text-sm mb-4" style={{ fontWeight: '500' }}>
                  Click on any payment method to view full details and QR code
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setShowPaymentModal(method)}
                      className="p-4 rounded-xl text-center cursor-pointer transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'rgba(238, 135, 36, 0.1)',
                        border: '2px solid rgba(238, 135, 36, 0.2)'
                      }}
                    >
                      <p className="text-white mb-2" style={{ fontWeight: '700' }}>{method.name}</p>
                      <ImageWithFallback
                        src={method.qrCode}
                        alt={`${method.name} QR`}
                        className="w-full h-32 object-contain mb-2 rounded-lg"
                      />
                      <div
                        className="w-full py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                        style={{
                          background: 'rgba(238, 135, 36, 0.2)',
                          border: '1px solid rgba(238, 135, 36, 0.3)',
                          color: '#ee8724',
                          fontWeight: '600'
                        }}
                      >
                        Click to view details
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donation Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 text-sm" style={{ fontWeight: '600' }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Enter your name or remain anonymous"
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(238, 135, 36, 0.3)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 text-sm" style={{ fontWeight: '600' }}>
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(238, 135, 36, 0.3)',
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 text-sm" style={{ fontWeight: '600' }}>
                    Donation Amount <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" style={{ fontWeight: '700' }}>
                      ₱
                    </span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none text-white"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(238, 135, 36, 0.3)',
                      }}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2 text-sm" style={{ fontWeight: '600' }}>
                    Upload Receipt <span className="text-red-400">*</span>
                  </label>
                  <div
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 hover:border-orange-400"
                    style={{
                      borderColor: 'rgba(238, 135, 36, 0.3)',
                      background: 'rgba(238, 135, 36, 0.05)'
                    }}
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                  >
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                    {receiptImage ? (
                      <div className="space-y-2">
                        <img src={receiptImage} alt="Receipt" className="max-h-40 mx-auto rounded-lg" />
                        <p className="text-green-400 text-sm flex items-center justify-center gap-2" style={{ fontWeight: '600' }}>
                          <Check className="w-4 h-4" />
                          Receipt uploaded successfully
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-orange-400 mx-auto mb-2" />
                        <p className="text-white mb-1" style={{ fontWeight: '600' }}>Click to upload receipt</p>
                        <p className="text-gray-400 text-sm" style={{ fontWeight: '500' }}>PNG or JPG (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleDonationSubmit}
                  className="w-full py-4 rounded-xl text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #f6421f 0%, #ee8724 100%)',
                    fontWeight: '700',
                    fontSize: '1.125rem',
                    boxShadow: '0 8px 20px rgba(246, 66, 31, 0.4)'
                  }}
                >
                  <Heart className="w-6 h-6" />
                  Submit Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <PaymentMethodModal
          paymentMethod={showPaymentModal}
          isDark={isDark}
          userRole={userRole}
          onClose={() => setShowPaymentModal(null)}
          onEdit={(method) => {
            // Handle edit - for now just show a toast
            toast.info('Edit payment method', {
              description: `Editing ${method.name} - Feature for admin/auditor only`
            });
          }}
        />
      )}
    </div>
  );
}
