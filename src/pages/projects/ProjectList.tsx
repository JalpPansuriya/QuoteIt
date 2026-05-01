import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, MapPin, Calendar, CheckCircle2, Clock, MoreVertical, Building2, LayoutGrid, List, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { ProjectStatus } from '../../types';
import { isWithinInterval } from 'date-fns';
import { FilterBar } from '../../components/FilterBar';

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, clients, role } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');

  const filteredProjects = projects.filter(p => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const interval = { start: fromDate, end: toDate };

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const inDateRange = isWithinInterval(new Date(p.createdAt), interval);
    const inProject = selectedProjectId === 'All' || p.id === selectedProjectId;

    return matchesSearch && matchesStatus && inDateRange && inProject;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Proposal': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Completed': return 'text-slate-600 bg-slate-50 border-slate-100';
      case 'On Hold': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Rejected': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage sites, track installation progress and revisions.</p>
        </div>
        {role === 'admin' && (
          <Button 
            onClick={() => navigate('/projects/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Project
          </Button>
        )}
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-700 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border-transparent rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Proposal">Proposal</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Rejected">Rejected</option>
          </select>

          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No projects found</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm px-6">
            {searchTerm || statusFilter !== 'All' 
              ? "No projects match your current search or filter criteria."
              : "You haven't created any projects yet. Start by creating a new site."}
          </p>
          {!searchTerm && statusFilter === 'All' && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/projects/new')}
              className="mt-8 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first project
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const client = clients.find(c => c.id === project.clientId);
            return (
              <div 
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer border-b-4 hover:border-b-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase",
                    getStatusColor(project.status)
                  )}>
                    {project.status}
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="truncate">{project.location || 'No location set'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{client?.name || 'Unknown Client'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{project.totalUnits} {project.unitType}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Units</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProjects.map((project) => {
                const client = clients.find(c => c.id === project.clientId);
                return (
                  <tr 
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</div>
                      <div className="text-xs text-slate-400 flex items-center mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 mr-1" />
                        {project.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-700">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black border tracking-wide uppercase",
                        getStatusColor(project.status)
                      )}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{project.totalUnits} <span className="text-slate-400 font-medium">{project.unitType}</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-slate-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
