import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router';

export function NotificationCenter() {
  const { alerts, markAlertAsRead, clearAllAlerts } = useStore();

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Notification Center</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread alerts.` : 'No unread alerts.'}
          </p>
        </div>
        {alerts.length > 0 && (
          <Button variant="outline" className="text-red-600 border-red-100 hover:bg-red-50" onClick={clearAllAlerts}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="font-medium text-lg">All caught up!</p>
              <p className="text-sm">Your notification history is empty.</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`transition-all duration-300 ${alert.read ? 'opacity-60 bg-slate-50/50' : 'border-l-4 border-l-blue-500 shadow-md shadow-blue-500/5'}`}
            >
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    alert.type === 'success' ? 'bg-green-100 text-green-600' :
                    alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {alert.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                    {alert.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                    {alert.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`font-bold text-slate-900 ${alert.read ? 'font-medium' : ''}`}>
                        {alert.message}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap ml-4">
                        {format(alert.timestamp, 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      {!alert.read && (
                        <button 
                          onClick={() => markAlertAsRead(alert.id)}
                          className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      {alert.link && (
                        <Link 
                          to={alert.link}
                          className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          View Details <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
