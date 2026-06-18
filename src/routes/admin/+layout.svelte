<script lang="ts">
  import '$lib/admin/admin.css';
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { fullName } from '$lib/types';
  import Toasts from '$lib/admin/components/Toasts.svelte';
  import ConfirmDialog from '$lib/admin/components/ConfirmDialog.svelte';
  import { toast, trackSubmit, releaseBusyButtons } from '$lib/admin/ux';

  let { data, children } = $props();

  // Surface every form-action result as a toast (errors stay inline too where pages keep them)
  $effect(() => {
    const f = $page.form as Record<string, unknown> | null;
    releaseBusyButtons();
    if (!f || typeof f !== 'object') return;
    const message = typeof f.message === 'string' && f.message ? f.message : null;
    if ($page.status >= 400) {
      toast.error(message ?? 'Something went wrong.');
    } else if (message) {
      toast.success(message);
    } else if (f.success) {
      toast.success('Saved.');
    }
  });

  afterNavigate(() => releaseBusyButtons());

  const nav = [
    { section: 'Operations' },
    { href: '/admin', label: 'Dashboard', icon: 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z' },
    { href: '/admin/live', label: 'Live', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { href: '/admin/approvals', label: 'Approvals', icon: 'M9 12l2 2 4-4m5.6 2A9 9 0 1 1 3.4 12a9 9 0 0 1 18.2 0z', count: true },
    { href: '/admin/tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
    { href: '/admin/sops', label: 'SOPs', icon: 'M12 6.25c-2.4-1.6-5.6-1.6-8 0v12c2.4-1.6 5.6-1.6 8 0 2.4-1.6 5.6-1.6 8 0v-12c-2.4-1.6-5.6-1.6-8 0zm0 0v12' },
    { href: '/admin/schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
    { section: 'People' },
    { href: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6-1.13a4 4 0 1 0-4-4 4 4 0 0 0 4 4z' },
    { href: '/admin/timesheets', label: 'Timesheets', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M8 2h8' },
    { href: '/admin/attendance-code', label: 'Attendance code', icon: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h-3zM18 18h3v3h-3z' },
    { href: '/admin/job-roles', label: 'Job Roles', icon: 'M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z' },
    { href: '/admin/responsibilities', label: 'Responsibilities', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4' },
    { section: 'Organization' },
    { href: '/admin/locations', label: 'Locations', icon: 'M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0zM15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
    { href: '/admin/departments', label: 'Departments', icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4' },
    { section: 'Insight' },
    { href: '/admin/incident-reports', label: 'Incident Reports', icon: 'M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2z' },
    { href: '/admin/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z' },
    { href: '/admin/audit', label: 'Audit Log', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { section: 'Proxie Extras' },
    { href: '/admin/menu', label: 'Menu Management', icon: 'M3 3v18h18V3H3zm12 14H9v-2h6v2zm0-4H9V11h6v2zm0-4H9V7h6v2z' },
    { href: '/admin/about', label: 'A Bit About Us', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
    { href: '/admin/workshops', label: 'In Person Workshops', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { href: '/admin/questions', label: 'Employee Questions', icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z M9 9h6 M9 13h4' },
    { href: '/admin/whistleblower', label: 'Whistleblower Reports', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01' },
    { href: '/admin/weekly-feedback', label: 'Weekly Feedback', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }
  ] as const;

  function isActive(href: string): boolean {
    if (href === '/admin') return $page.url.pathname === '/admin';
    return $page.url.pathname.startsWith(href);
  }

  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/live': 'Live',
    '/admin/timesheets': 'Timesheets',
    '/admin/attendance-code': 'Attendance code',
    '/admin/approvals': 'Approvals',
    '/admin/tasks': 'Task Management',
    '/admin/sops': 'SOP Builder',
    '/admin/schedule': 'Schedule',
    '/admin/users': 'Users',
    '/admin/job-roles': 'Job Roles',
    '/admin/responsibilities': 'Responsibilities',
    '/admin/locations': 'Locations',
    '/admin/departments': 'Departments',
    '/admin/incident-reports': 'Incident reports',
    '/admin/reports': 'Reports',
    '/admin/audit': 'Audit Log',
    '/admin/settings': 'Settings',
    '/admin/menu': 'Menu Management',
    '/admin/about': 'A Bit About Us',
    '/admin/workshops': 'In Person Workshops',
    '/admin/questions': 'Employee Questions',
    '/admin/whistleblower': 'Whistleblower Reports',
    '/admin/weekly-feedback': 'Weekly Feedback'
  };

  let pageTitle = $derived.by(() => {
    const path = $page.url.pathname;
    const match = Object.keys(titles)
      .sort((a, b) => b.length - a.length)
      .find((k) => path === k || path.startsWith(k + '/'));
    return match ? titles[match] : 'Admin';
  });
</script>

<svelte:head>
  <title>{pageTitle} — SessionPilot Ops</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="admin-shell" onsubmitcapture={trackSubmit}>
  <Toasts />
  <ConfirmDialog />
  <aside class="admin-sidebar">
    <div class="brand">
      <img class="mark" src="/SP.avif" alt="SessionPilot Ops" width="32" height="32" />
      <div class="name">SessionPilot <span>Ops</span></div>
    </div>
    <nav class="admin-nav">
      {#each nav.filter(item => {
        const isSuperAdmin = data.profile?.role === 'super_admin';
        if (!isSuperAdmin) {
          if ('section' in item && item.section === 'Organization') return false;
          if ('href' in item && (item.href === '/admin/locations' || item.href === '/admin/departments')) return false;
        }
        return true;
      }) as item}
        {#if 'section' in item && item.section}
          <div class="section">{item.section}</div>
        {:else if 'href' in item}
          <a href={item.href} class:active={isActive(item.href)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d={item.icon}></path>
            </svg>
            <span class="label">{item.label}</span>
            {#if 'count' in item && item.count && data.pendingApprovals > 0}
              <span class="count">{data.pendingApprovals}</span>
            {/if}
          </a>
        {/if}
      {/each}
    </nav>
  </aside>

  <div class="admin-main">
    <header class="admin-topbar">
      <div class="page-title">{pageTitle}</div>
      <div class="who">
        <span class="role-pill">{data.profile?.role?.replaceAll('_', ' ') ?? 'manager'}</span>
        <span>{fullName(data.profile)}</span>
        <form method="POST" action="/login?/logout">
          <button class="btn sm" type="submit">Sign out</button>
        </form>
      </div>
    </header>
    <main class="admin-content">
      {@render children()}
    </main>
  </div>
</div>
