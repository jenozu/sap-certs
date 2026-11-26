'use client';
// Same shell markup and classes as the workspace (app/page.tsx) so the design matches.
// Workspace views link back with ?view=, practice routes are real pages.
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { BookOpen, BriefcaseBusiness, CalendarDays, Compass, Dumbbell, FolderKanban, GitBranch, Layers, Library, Menu, Route, Scale, ShieldCheck, X } from 'lucide-react';

const workspaceNav = [['Roadmap', Route], ['Current phase', Layers], ['Weekly plan', CalendarDays], ['Learning library', BookOpen], ['Projects', FolderKanban], ['Portfolio', BriefcaseBusiness], ['Career checkpoints', Compass], ['Compare next steps', Scale]] as const;
export const practiceNav = [['Practice', '/practice', Dumbbell], ['Skill library', '/skills', Library]] as const;

export function PracticeShell({ active, crumb, children }: { active: 'Practice' | 'Skill library'; crumb?: string; children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <Link className="brand" href="/"><span className="brand-icon"><GitBranch size={22} /></span>pathway<span className="brand-dot">.</span></Link>
        <div className="workspace-name"><span className="avatar">AO</span><div><strong>Andel’s workspace</strong><small>SAP & coding career</small></div>
          <button className="mobile-only icon-button" onClick={() => setMobile(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <div className="nav-label">YOUR WORKSPACE</div>
        <nav>{workspaceNav.map(([name, Icon]) => <Link className="nav-item" key={name} href={`/?view=${encodeURIComponent(name)}`}><Icon size={19} />{name}</Link>)}</nav>
        <div className="nav-label">PRACTICE</div>
        <nav>{practiceNav.map(([name, href, Icon]) => <Link className={active === name ? 'nav-item selected' : 'nav-item'} key={name} href={href} aria-current={active === name ? 'page' : undefined}><Icon size={19} />{name}</Link>)}</nav>
        <div className="sidebar-bottom"><div className="private"><ShieldCheck size={14} /> Private workspace</div></div>
      </aside>
      {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Close menu" />}
      <div className="main-shell">
        <header className="topbar"><div className="row">
          <button className="mobile-only icon-button" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <span className="breadcrumb">{active} {crumb && <><span>/</span> <strong>{crumb}</strong></>}</span>
        </div></header>
        <main>{children}</main>
      </div>
    </div>
  );
}
