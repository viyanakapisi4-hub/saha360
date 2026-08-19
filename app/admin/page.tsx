"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Opinion = {
  id: number;
  created_at: string;
  name: string;
  surname: string;
  phone: string | null;
  group_name: string | null;
  department: string | null;
  opinion: "destekliyor" | "desteklemiyor" | "kararsiz";
  note: string | null;
  created_by: string | null;
  created_by_email: string | null;
};

type PersonnelStats = {
  email: string;
  total: number;
  today: number;
  thisMonth: number;
  support: number;
  against: number;
  undecided: number;
};

type DepartmentStats = {
  department: string;
  total: number;
  support: number;
  against: number;
  undecided: number;
  supportPercent: number;
};

type AdminUser = {
  user_id: string;
  email: string;
  role: "admin" | "personel" | string;
  created_at: string;
};

type AuditLog = {
  id: number;
  user_id: string | null;
  user_email: string | null;
  action: string;
  target_id: number | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type DeletedOpinion = {
  id: number;
  original_id: number | null;
  data: Opinion;
  deleted_by: string | null;
  deleted_by_email: string | null;
  deleted_at: string;
};

type Tab =
  | "dashboard"
  | "personnel"
  | "logs"
  | "trash"
  | "settings";

export default function AdminPage() {
  const router = useRouter();

  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [opinionFilter, setOpinionFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [personnelFilter, setPersonnelFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<Tab>("dashboard");

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletedOpinions, setDeletedOpinions] =
    useState<DeletedOpinion[]>([]);

  const [panelTitle, setPanelTitle] =
    useState("Saha360");

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [autoRefreshEnabled, setAutoRefreshEnabled] =
    useState(true);

  const [newRecordCount, setNewRecordCount] =
    useState(0);

  const [lastKnownCount, setLastKnownCount] =
    useState(0);

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [settingsSaving, setSettingsSaving] =
    useState(false);

  const [personnelEmail, setPersonnelEmail] =
    useState("");

    const [personnelPassword, setPersonnelPassword] =
  useState("");

  const [personnelRole, setPersonnelRole] =
    useState<"admin" | "personel">("personel");

  const [currentUserEmail, setCurrentUserEmail] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [showRefreshScreen, setShowRefreshScreen] =
    useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return null;
    }

    setCurrentUserEmail(user.email || "");

    return user;
  }

  async function writeAudit(
    action: string,
    targetId?: number | null,
    targetName?: string | null,
    details?: Record<string, unknown>
  ) {
    const user = await supabase.auth.getUser();

    if (!user.data.user) return;

    await supabase.from("audit_logs").insert({
      user_id: user.data.user.id,
      user_email: user.data.user.email,
      action,
      target_id: targetId ?? null,
      target_name: targetName ?? null,
      details: details ?? null,
    });
  }

  async function loadOpinions(
    showAnimation = false
  ) {
    if (showAnimation) {
      setRefreshing(true);
      setShowRefreshScreen(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 1300)
      );
    }

    setLoading(true);

    const user = await checkUser();

    if (!user) {
      setLoading(false);
      setRefreshing(false);
      setShowRefreshScreen(false);
      return;
    }

    const { data, error } = await supabase
      .from("field_opinions")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      alert(
        "Kayıtlar alınırken hata oluştu: " +
          error.message
      );

      setLoading(false);
      setRefreshing(false);
      setShowRefreshScreen(false);

      return;
    }

    const newData = (data || []) as Opinion[];

    if (
      lastKnownCount > 0 &&
      newData.length > lastKnownCount &&
      notificationsEnabled
    ) {
      setNewRecordCount(
        newData.length - lastKnownCount
      );
    }

    setOpinions(newData);
    setLastKnownCount(newData.length);

    setLoading(false);

    if (showAnimation) {
      setRefreshKey((v) => v + 1);

      setTimeout(() => {
        setRefreshing(false);
        setShowRefreshScreen(false);
      }, 500);
    }
  }

  async function loadAdminUsers() {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setAdminUsers((data || []) as AdminUser[]);
    }
  }

  async function loadAuditLogs() {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (error) {
    console.error(
      "İşlem kayıtları yüklenemedi:",
      error
    );

    alert(
      "İşlem kayıtları yüklenemedi: " +
        error.message
    );

    return;
  }

  setAuditLogs(
    (data || []) as AuditLog[]
  );
}

async function loadTrash() {
  const { data, error } = await supabase
    .from("deleted_opinions")
    .select("*")
    .order("deleted_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Çöp kutusu yüklenemedi:",
      error
    );

    alert(
      "Çöp kutusu yüklenemedi: " +
        error.message
    );

    return;
  }

  const parsed = (data || []).map(
    (item) => ({
      ...item,
      data:
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data,
    })
  );

  setDeletedOpinions(
    parsed as DeletedOpinion[]
  );
}

  async function loadSettings() {
    const { data, error } = await supabase
      .from("panel_settings")
      .select("*");

    if (error || !data) return;

    data.forEach((item) => {
      if (item.setting_key === "panel_title") {
        setPanelTitle(
          item.setting_value || "Saha360"
        );
      }

      if (
        item.setting_key ===
        "notifications_enabled"
      ) {
        setNotificationsEnabled(
          item.setting_value === "true"
        );
      }

      if (
        item.setting_key ===
        "auto_refresh_enabled"
      ) {
        setAutoRefreshEnabled(
          item.setting_value === "true"
        );
      }
    });
  }

  async function initialLoad() {
    await checkUser();

    await Promise.all([
      loadOpinions(false),
      loadAdminUsers(),
      loadAuditLogs(),
      loadTrash(),
      loadSettings(),
    ]);
  }

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadOpinions(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [
    autoRefreshEnabled,
    notificationsEnabled,
    lastKnownCount,
  ]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Bu kayıt çöp kutusuna taşınacak. Devam edilsin mi?"
    );

    if (!confirmed) return;

    const item = opinions.find(
      (opinion) => opinion.id === id
    );

    if (!item) return;

    const user =
      await supabase.auth.getUser();

    if (!user.data.user) return;

    const { error: trashError } =
      await supabase
        .from("deleted_opinions")
        .insert({
          original_id: item.id,
          data: item,
          deleted_by: user.data.user.id,
          deleted_by_email:
            user.data.user.email,
        });

    if (trashError) {
      alert(
        "Çöp kutusuna taşınamadı: " +
          trashError.message
      );
      return;
    }

    const { error } = await supabase
      .from("field_opinions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(
        "Kayıt silinemedi: " +
          error.message
      );
      return;
    }

    await writeAudit(
      "KAYIT_SILINDI",
      id,
      `${item.name} ${item.surname}`
    );

    setOpinions((current) =>
      current.filter(
        (opinion) => opinion.id !== id
      )
    );

    setSelectedIds((current) =>
      current.filter(
        (selectedId) => selectedId !== id
      )
    );

    await loadTrash();
    await loadAuditLogs();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `${selectedIds.length} kayıt çöp kutusuna taşınacak. Devam edilsin mi?`
    );

    if (!confirmed) return;

    const selected = opinions.filter((item) =>
      selectedIds.includes(item.id)
    );

    const user =
      await supabase.auth.getUser();

    if (!user.data.user) return;

    for (const item of selected) {
      await supabase
        .from("deleted_opinions")
        .insert({
          original_id: item.id,
          data: item,
          deleted_by:
            user.data.user.id,
          deleted_by_email:
            user.data.user.email,
        });

      await supabase
        .from("field_opinions")
        .delete()
        .eq("id", item.id);

      await writeAudit(
        "TOPLU_KAYIT_SILINDI",
        item.id,
        `${item.name} ${item.surname}`
      );
    }

    setOpinions((current) =>
      current.filter(
        (item) =>
          !selectedIds.includes(item.id)
      )
    );

    setSelectedIds([]);

    await loadTrash();
    await loadAuditLogs();
  }

  async function restoreOpinion(
    item: DeletedOpinion
  ) {
    const data = item.data;

    const {
      id,
      ...withoutId
    } = data;

    const { error } = await supabase
      .from("field_opinions")
      .insert({
        ...withoutId,
      });

    if (error) {
      alert(
        "Kayıt geri yüklenemedi: " +
          error.message
      );
      return;
    }

    await supabase
      .from("deleted_opinions")
      .delete()
      .eq("id", item.id);

    await writeAudit(
      "KAYIT_GERI_YUKLENDI",
      item.original_id,
      `${data.name} ${data.surname}`
    );

    await loadOpinions(false);
    await loadTrash();
    await loadAuditLogs();
  }

  async function permanentlyDelete(
    item: DeletedOpinion
  ) {
    const confirmed = window.confirm(
      "Bu kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("deleted_opinions")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert(
        "Kalıcı silme başarısız: " +
          error.message
      );
      return;
    }

    await writeAudit(
      "KAYIT_KALICI_SILINDI",
      item.original_id,
      `${item.data.name} ${item.data.surname}`
    );

    await loadTrash();
    await loadAuditLogs();
  }

  async function addPersonnel() {
  const email =
    personnelEmail.trim().toLowerCase();

  const password =
    personnelPassword.trim();

  if (!email) {
    alert("Email gir.");
    return;
  }

  if (!password) {
    alert("Şifre gir.");
    return;
  }

  if (password.length < 6) {
    alert(
      "Şifre en az 6 karakter olmalıdır."
    );
    return;
  }

  const { data, error } =
    await supabase.functions.invoke(
      "create-personnel",
      {
        body: {
          email,
          password,
          role: personnelRole,
        },
      }
    );

 if (error) {
  console.error(
    "Personel ekleme hatası:",
    error
  );

  let detail = error.message;

  try {
    const response =
      (error as any).context;

    if (response) {
      const body =
        await response.json();

      if (body?.error) {
        detail = body.error;
      }
    }
  } catch (e) {
    console.error(
      "Hata detayı okunamadı:",
      e
    );
  }

  alert(
    "Personel eklenemedi: " +
      detail
  );

  return;
}

  if (!data?.success) {
    alert(
      "Personel eklenemedi: " +
        (data?.error ||
          "Bilinmeyen hata")
    );

    return;
  }

  await writeAudit(
    "PERSONEL_EKLENDI",
    data.user?.id || null,
    email,
    {
      role: personnelRole,
    }
  );

  setPersonnelEmail("");
  setPersonnelPassword("");
  setPersonnelRole("personel");

  await loadAdminUsers();
  await loadAuditLogs();

  alert(
    "Personel başarıyla eklendi."
  );
}

  async function changePersonnelRole(
    user: AdminUser,
    role: "admin" | "personel"
  ) {
    if (user.user_id ===
      (
        await supabase.auth.getUser()
      ).data.user?.id) {
      alert(
        "Kendi yetkini buradan değiştiremezsin."
      );
      return;
    }

    const { error } = await supabase
      .from("admin_users")
      .update({ role })
      .eq("user_id", user.user_id);

    if (error) {
      alert(
        "Yetki değiştirilemedi: " +
          error.message
      );
      return;
    }

    await writeAudit(
      "PERSONEL_YETKISI_DEGISTI",
      null,
      user.email,
      {
        role,
      }
    );

    await loadAdminUsers();
    await loadAuditLogs();
  }

  async function removePersonnel(
    user: AdminUser
  ) {
    const current =
      await supabase.auth.getUser();

    if (
      current.data.user?.id ===
      user.user_id
    ) {
      alert(
        "Kendi hesabını silemezsin."
      );
      return;
    }

    const confirmed = window.confirm(
      `${user.email} personel listesinden kaldırılacak. Emin misin?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("user_id", user.user_id);

    if (error) {
      alert(
        "Personel silinemedi: " +
          error.message
      );
      return;
    }

    await writeAudit(
      "PERSONEL_KALDIRILDI",
      null,
      user.email
    );

    await loadAdminUsers();
    await loadAuditLogs();
  }

  async function saveSetting(
    key: string,
    value: string
  ) {
    setSettingsSaving(true);

    const user =
      await supabase.auth.getUser();

    const { error } = await supabase
      .from("panel_settings")
      .upsert(
        {
          setting_key: key,
          setting_value: value,
          updated_by:
            user.data.user?.id || null,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        }
      );

    if (error) {
      alert(
        "Ayar kaydedilemedi: " +
          error.message
      );
    }

    setSettingsSaving(false);
  }

  async function saveAllSettings() {
    await saveSetting(
      "panel_title",
      panelTitle
    );

    await saveSetting(
      "notifications_enabled",
      String(notificationsEnabled)
    );

    await saveSetting(
      "auto_refresh_enabled",
      String(autoRefreshEnabled)
    );

    await writeAudit(
      "PANEL_AYARLARI_GUNCELLENDI"
    );

    await loadAuditLogs();

    alert("Ayarlar kaydedildi.");
  }

  function formatDate(dateString: string) {
    return new Date(
      dateString
    ).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function opinionLabel(
    value: Opinion["opinion"]
  ) {
    if (value === "destekliyor")
      return "Destekliyor";

    if (value === "desteklemiyor")
      return "Desteklemiyor";

    return "Kararsız";
  }

  function opinionStyle(
    value: Opinion["opinion"]
  ) {
    if (value === "destekliyor") {
      return "bg-green-500/10 border-green-500/30 text-green-400";
    }

    if (value === "desteklemiyor") {
      return "bg-red-500/10 border-red-500/30 text-red-400";
    }

    return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
  }

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        opinions
          .map(
            (item) =>
              item.department?.trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      String(a).localeCompare(
        String(b),
        "tr"
      )
    ) as string[];
  }, [opinions]);

  const personnelEmails = useMemo(() => {
    return Array.from(
      new Set(
        opinions.map(
          (item) =>
            item.created_by_email ||
            "Bilinmiyor"
        )
      )
    ).sort();
  }, [opinions]);

  const filteredOpinions = useMemo(() => {
    const searchText = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    const now = new Date();

    return opinions.filter((item) => {
      const fullName =
        `${item.name} ${item.surname}`.toLocaleLowerCase(
          "tr-TR"
        );

      const phone =
        item.phone?.toLocaleLowerCase(
          "tr-TR"
        ) || "";

      const department =
        item.department?.toLocaleLowerCase(
          "tr-TR"
        ) || "";

      const email =
        item.created_by_email?.toLocaleLowerCase(
          "tr-TR"
        ) || "";

      const note =
        item.note?.toLocaleLowerCase(
          "tr-TR"
        ) || "";

      const matchesSearch =
        !searchText ||
        fullName.includes(searchText) ||
        phone.includes(searchText) ||
        department.includes(searchText) ||
        email.includes(searchText) ||
        note.includes(searchText);

      const matchesOpinion =
        !opinionFilter ||
        item.opinion === opinionFilter;

      const matchesDepartment =
        !departmentFilter ||
        item.department ===
          departmentFilter;

      const matchesPersonnel =
        !personnelFilter ||
        (item.created_by_email ||
          "Bilinmiyor") ===
          personnelFilter;

      let matchesDate = true;

      const date = new Date(
        item.created_at
      );

      if (dateFilter === "today") {
        matchesDate =
          date.toDateString() ===
          now.toDateString();
      }

      if (dateFilter === "7days") {
        const start = new Date();
        start.setDate(
          start.getDate() - 6
        );

        matchesDate = date >= start;
      }

      if (dateFilter === "month") {
        matchesDate =
          date.getMonth() ===
            now.getMonth() &&
          date.getFullYear() ===
            now.getFullYear();
      }

      return (
        matchesSearch &&
        matchesOpinion &&
        matchesDepartment &&
        matchesPersonnel &&
        matchesDate
      );
    });
  }, [
    opinions,
    search,
    opinionFilter,
    departmentFilter,
    personnelFilter,
    dateFilter,
  ]);

  const supportCount = opinions.filter(
    (item) =>
      item.opinion === "destekliyor"
  ).length;

  const againstCount = opinions.filter(
    (item) =>
      item.opinion === "desteklemiyor"
  ).length;

  const undecidedCount = opinions.filter(
    (item) =>
      item.opinion === "kararsiz"
  ).length;

  const dateStats = useMemo(() => {
    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const sevenDaysStart =
      new Date(todayStart);

    sevenDaysStart.setDate(
      sevenDaysStart.getDate() - 6
    );

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    let today = 0;
    let lastSevenDays = 0;
    let thisMonth = 0;

    opinions.forEach((item) => {
      const date = new Date(
        item.created_at
      );

      if (date >= todayStart)
        today++;

      if (date >= sevenDaysStart)
        lastSevenDays++;

      if (date >= monthStart)
        thisMonth++;
    });

    return {
      today,
      lastSevenDays,
      thisMonth,
    };
  }, [opinions]);

  const opinionStats = useMemo(() => {
    const total = opinions.length;

    if (!total) {
      return {
        support: 0,
        against: 0,
        undecided: 0,
        supportPercent: 0,
        againstPercent: 0,
        undecidedPercent: 0,
      };
    }

    const support =
      supportCount;

    const against =
      againstCount;

    const undecided =
      undecidedCount;

    return {
      support,
      against,
      undecided,
      supportPercent: Math.round(
        (support / total) * 100
      ),
      againstPercent: Math.round(
        (against / total) * 100
      ),
      undecidedPercent: Math.round(
        (undecided / total) * 100
      ),
    };
  }, [
    opinions,
    supportCount,
    againstCount,
    undecidedCount,
  ]);

  const personnelStats =
    useMemo(() => {
      const now = new Date();

      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      const map = new Map<
        string,
        PersonnelStats
      >();

      opinions.forEach((item) => {
        const email =
          item.created_by_email ||
          "Bilinmiyor";

        if (!map.has(email)) {
          map.set(email, {
            email,
            total: 0,
            today: 0,
            thisMonth: 0,
            support: 0,
            against: 0,
            undecided: 0,
          });
        }

        const person =
          map.get(email)!;

        person.total++;

        const createdAt =
          new Date(
            item.created_at
          );

        if (
          createdAt >= todayStart
        )
          person.today++;

        if (
          createdAt >= monthStart
        )
          person.thisMonth++;

        if (
          item.opinion ===
          "destekliyor"
        )
          person.support++;

        if (
          item.opinion ===
          "desteklemiyor"
        )
          person.against++;

        if (
          item.opinion ===
          "kararsiz"
        )
          person.undecided++;
      });

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.total - a.total
      );
    }, [opinions]);

  const departmentStats =
    useMemo(() => {
      const map = new Map<
        string,
        DepartmentStats
      >();

      opinions.forEach((item) => {
        const department =
          item.department?.trim() ||
          "Bölüm Belirtilmemiş";

        if (!map.has(department)) {
          map.set(department, {
            department,
            total: 0,
            support: 0,
            against: 0,
            undecided: 0,
            supportPercent: 0,
          });
        }

        const stats =
          map.get(department)!;

        stats.total++;

        if (
          item.opinion ===
          "destekliyor"
        )
          stats.support++;

        if (
          item.opinion ===
          "desteklemiyor"
        )
          stats.against++;

        if (
          item.opinion ===
          "kararsiz"
        )
          stats.undecided++;

        stats.supportPercent =
          Math.round(
            (stats.support /
              stats.total) *
              100
          );
      });

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.total - a.total
      );
    }, [opinions]);

  const selectedPerson = useMemo(() => {
    if (!selectedPersonnel)
      return null;

    return (
      personnelStats.find(
        (person) =>
          person.email ===
          selectedPersonnel
      ) || null
    );
  }, [
    selectedPersonnel,
    personnelStats,
  ]);

  const selectedPersonOpinions =
    useMemo(() => {
      if (!selectedPersonnel)
        return [];

      return opinions
        .filter(
          (item) =>
            (item.created_by_email ||
              "Bilinmiyor") ===
            selectedPersonnel
        )
        .sort(
          (a, b) =>
            new Date(
              b.created_at
            ).getTime() -
            new Date(
              a.created_at
            ).getTime()
        );
    }, [
      opinions,
      selectedPersonnel,
    ]);

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (x) => x !== id
          )
        : [...current, id]
    );
  }

  function toggleAll() {
    const ids =
      filteredOpinions.map(
        (item) => item.id
      );

    const allSelected =
      ids.length > 0 &&
      ids.every((id) =>
        selectedIds.includes(id)
      );

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) => !ids.includes(id)
        )
      );
    } else {
      setSelectedIds((current) =>
        Array.from(
          new Set([
            ...current,
            ...ids,
          ])
        )
      );
    }
  }

  function handleExportCSV() {
    if (!filteredOpinions.length) {
      alert(
        "Dışa aktarılacak kayıt bulunmuyor."
      );
      return;
    }

    const headers = [
      "Tarih",
      "Ad",
      "Soyad",
      "Telefon",
      "Bölüm",
      "Görüş",
      "Not",
      "Kaydeden",
    ];

    function csvEscape(
      value:
        | string
        | number
        | null
        | undefined
    ) {
      if (
        value === null ||
        value === undefined
      )
        return '""';

      return `"${String(value).replace(
        /"/g,
        '""'
      )}"`;
    }

    const rows =
      filteredOpinions.map(
        (item) =>
          [
            formatDate(
              item.created_at
            ),
            item.name,
            item.surname,
            item.phone,
            item.department,
            opinionLabel(
              item.opinion
            ),
            item.note,
            item.created_by_email,
          ]
            .map(csvEscape)
            .join(",")
      );

    const csv = [
      headers
        .map(csvEscape)
        .join(","),
      ...rows,
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `saha360-gorusler-${new Date()
        .toLocaleDateString(
          "tr-TR"
        )
        .replace(
          /\./g,
          "-"
        )}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const backup = {
      exported_at:
        new Date().toISOString(),
      opinions,
      adminUsers,
      settings: {
        panelTitle,
        notificationsEnabled,
        autoRefreshEnabled,
      },
    };

    const blob = new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `saha360-yedek-${new Date()
        .toLocaleDateString(
          "tr-TR"
        )
        .replace(
          /\./g,
          "-"
        )}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    writeAudit(
      "YEDEK_ALINDI"
    );
  }

  function clearFilters() {
    setSearch("");
    setOpinionFilter("");
    setDepartmentFilter("");
    setPersonnelFilter("");
    setDateFilter("");
  }

  function navButton(
    tab: Tab,
    icon: string,
    label: string
  ) {
    return (
      <button
        type="button"
        onClick={() => {
          setActiveTab(tab);
          setMobileMenu(false);
          setNewRecordCount(0);
        }}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition ${
          activeTab === tab
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">

      {/* YENİLEME EKRANI */}

      {showRefreshScreen && (
        <div
          key={refreshKey}
          className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center"
        >
          <div className="relative w-44 h-44 flex items-center justify-center">

            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-blue-500 border-r-blue-400 animate-spin" />

            <div className="absolute inset-3 rounded-full border border-blue-500/20 animate-[spin_3s_linear_infinite_reverse]" />

            <div className="w-28 h-28 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-2xl shadow-blue-500/20 overflow-hidden z-10">
              <img
                src="/saha360-logo.png"
                alt="Saha360 Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

          </div>
        </div>
      )}

      <div className="max-w-[1700px] mx-auto">

        {/* HEADER */}

        <header className="relative mb-7">

          <div className="flex flex-col items-center text-center">

            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-xl shadow-blue-500/10 overflow-hidden mb-4">
              <img
                src="/saha360-logo.png"
                alt="Saha360 Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <h1 className="text-4xl md:text-5xl font-black">
              Saha
              <span className="text-blue-500">
                360
              </span>
            </h1>

            <p className="text-slate-400 mt-2">
              {panelTitle} Yönetim Paneli
            </p>

          </div>

          <div className="absolute right-0 top-0 hidden md:flex gap-2">

            <button
              type="button"
              onClick={() =>
                loadOpinions(true)
              }
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 rounded-2xl font-bold transition active:scale-95"
            >
              ↻ Yenile
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-2xl font-bold transition"
            >
              Çıkış
            </button>

          </div>

        </header>

        {/* MOBİL ÜST BAR */}

        <div className="md:hidden flex items-center justify-between gap-2 mb-5">

          <button
            type="button"
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
            className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl font-bold"
          >
            ☰ Menü
          </button>

          <button
            type="button"
            onClick={() =>
              loadOpinions(true)
            }
            disabled={refreshing}
            className="bg-blue-600 px-4 py-3 rounded-2xl font-bold"
          >
            ↻
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl font-bold"
          >
            Çıkış
          </button>

        </div>

        {/* NAV */}

        <div
          className={`${
            mobileMenu
              ? "block"
              : "hidden"
          } md:block mb-7`}
        >

          <nav className="bg-slate-900 border border-slate-800 rounded-3xl p-2 flex flex-col md:flex-row gap-2 overflow-x-auto">

            {navButton(
              "dashboard",
              "📊",
              "Dashboard"
            )}

            {navButton(
              "personnel",
              "👥",
              "Personel"
            )}

            {navButton(
              "logs",
              "📜",
              "İşlem Kayıtları"
            )}

            {navButton(
              "trash",
              "🗑️",
              "Çöp Kutusu"
            )}

            {navButton(
              "settings",
              "⚙️",
              "Ayarlar"
            )}

          </nav>

        </div>

        {/* BİLDİRİM */}

        {newRecordCount > 0 &&
          notificationsEnabled && (
            <button
              type="button"
              onClick={() => {
                setNewRecordCount(0);
                loadOpinions(true);
              }}
              className="w-full mb-6 bg-blue-500/10 border border-blue-500/30 rounded-3xl p-4 text-left hover:bg-blue-500/15 transition"
            >
              🔔{" "}
              <span className="font-bold">
                {newRecordCount} yeni görüş
              </span>{" "}
              geldi. Görmek için tıkla.
            </button>
          )}

        {/* =========================
            DASHBOARD
        ========================= */}

        {activeTab ===
          "dashboard" && (
          <>

            {/* ANA İSTATİSTİKLER */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-7">

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6">
                <p className="text-slate-400 text-sm">
                  Toplam Görüş
                </p>
                <p className="text-3xl md:text-4xl font-black mt-2">
                  {opinions.length}
                </p>
              </div>

              <div className="bg-slate-900 border border-green-500/10 rounded-3xl p-5 md:p-6">
                <p className="text-green-400 text-sm">
                  🟢 Destekliyor
                </p>
                <p className="text-3xl md:text-4xl font-black mt-2">
                  {supportCount}
                </p>
              </div>

              <div className="bg-slate-900 border border-red-500/10 rounded-3xl p-5 md:p-6">
                <p className="text-red-400 text-sm">
                  🔴 Desteklemiyor
                </p>
                <p className="text-3xl md:text-4xl font-black mt-2">
                  {againstCount}
                </p>
              </div>

              <div className="bg-slate-900 border border-yellow-500/10 rounded-3xl p-5 md:p-6">
                <p className="text-yellow-400 text-sm">
                  🟡 Kararsız
                </p>
                <p className="text-3xl md:text-4xl font-black mt-2">
                  {undecidedCount}
                </p>
              </div>

            </div>

            {/* TARİH */}

            <section className="mb-8">

              <h2 className="text-xl font-black mb-4">
                📅 Tarih İstatistikleri
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-slate-900 border border-blue-500/20 rounded-3xl p-6">
                  <p className="text-blue-400 text-sm font-semibold">
                    Bugün
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Bugün kaydedilen görüşler
                  </p>
                  <p className="text-4xl font-black mt-5">
                    {dateStats.today}
                  </p>
                </div>

                <div className="bg-slate-900 border border-purple-500/20 rounded-3xl p-6">
                  <p className="text-purple-400 text-sm font-semibold">
                    Son 7 Gün
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Son 7 gündeki görüşler
                  </p>
                  <p className="text-4xl font-black mt-5">
                    {dateStats.lastSevenDays}
                  </p>
                </div>

                <div className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6">
                  <p className="text-cyan-400 text-sm font-semibold">
                    Bu Ay
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Bu ay kaydedilen görüşler
                  </p>
                  <p className="text-4xl font-black mt-5">
                    {dateStats.thisMonth}
                  </p>
                </div>

              </div>

            </section>

            {/* GÖRÜŞ DAĞILIMI */}

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 mb-8">

              <h2 className="text-2xl font-black mb-7">
                📊 Görüş Dağılımı
              </h2>

              <div className="space-y-6">

                {[
                  {
                    label:
                      "Destekliyor",
                    count:
                      opinionStats.support,
                    percent:
                      opinionStats.supportPercent,
                    bar: "bg-green-500",
                    text: "text-green-400",
                  },
                  {
                    label:
                      "Desteklemiyor",
                    count:
                      opinionStats.against,
                    percent:
                      opinionStats.againstPercent,
                    bar: "bg-red-500",
                    text: "text-red-400",
                  },
                  {
                    label:
                      "Kararsız",
                    count:
                      opinionStats.undecided,
                    percent:
                      opinionStats.undecidedPercent,
                    bar: "bg-yellow-500",
                    text: "text-yellow-400",
                  },
                ].map((item) => (
                  <div key={item.label}>

                    <div className="flex justify-between mb-2">

                      <span className="font-bold">
                        {item.label}{" "}
                        <span className="text-slate-500 text-sm">
                          ({item.count})
                        </span>
                      </span>

                      <span
                        className={`${item.text} font-black`}
                      >
                        %{item.percent}
                      </span>

                    </div>

                    <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">

                      <div
                        className={`h-full ${item.bar} rounded-full transition-all duration-700`}
                        style={{
                          width: `${item.percent}%`,
                        }}
                      />

                    </div>

                  </div>
                ))}

              </div>

            </section>

            {/* PERSONEL */}

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 mb-8">

              <div className="flex items-center justify-between mb-6">

                <div>
                  <h2 className="text-2xl font-black">
                    👥 Personel Performansı
                  </h2>
                  <p className="text-slate-400 mt-1">
                    Detayları görmek için personele tıklayın
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                  <span className="text-blue-400 font-bold">
                    {personnelStats.length}
                  </span>
                  <span className="text-slate-400 ml-2">
                    personel
                  </span>
                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {personnelStats.map(
                  (person, index) => (
                    <button
                      type="button"
                      key={person.email}
                      onClick={() =>
                        setSelectedPersonnel(
                          person.email
                        )
                      }
                      className="text-left bg-slate-800/50 border border-slate-700 hover:border-blue-500/40 rounded-3xl p-5 transition"
                    >

                      <div className="flex items-center justify-between mb-5">

                        <div className="flex items-center gap-3">

                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                            {index === 0
                              ? "🏆"
                              : "👤"}
                          </div>

                          <div>
                            <p className="font-bold break-all">
                              {person.email}
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              Detayları görüntüle →
                            </p>
                          </div>

                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black">
                            {person.total}
                          </p>
                          <p className="text-xs text-slate-500">
                            toplam
                          </p>
                        </div>

                      </div>

                      <div className="grid grid-cols-3 gap-2">

                        <div className="bg-slate-900 rounded-2xl p-3">
                          <p className="text-xs text-slate-500">
                            Bugün
                          </p>
                          <p className="text-xl font-black">
                            {person.today}
                          </p>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-3">
                          <p className="text-xs text-slate-500">
                            Bu Ay
                          </p>
                          <p className="text-xl font-black">
                            {person.thisMonth}
                          </p>
                        </div>

                        <div className="bg-green-500/10 rounded-2xl p-3">
                          <p className="text-xs text-green-400">
                            Destek
                          </p>
                          <p className="text-xl font-black text-green-400">
                            {person.support}
                          </p>
                        </div>

                      </div>

                    </button>
                  )
                )}

              </div>

            </section>

            {/* BÖLÜMLER */}

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 mb-8">

              <h2 className="text-2xl font-black mb-6">
                🎓 Bölüm Bazlı Analiz
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {departmentStats.map(
                  (department) => (
                    <div
                      key={
                        department.department
                      }
                      className="bg-slate-800/50 border border-slate-700 rounded-3xl p-5"
                    >

                      <div className="flex justify-between gap-3 mb-5">

                        <div className="min-w-0">
                          <h3 className="font-black text-lg truncate">
                            {
                              department.department
                            }
                          </h3>

                          <p className="text-xs text-slate-500 mt-1">
                            {
                              department.total
                            }{" "}
                            toplam görüş
                          </p>
                        </div>

                        <span className="text-xl">
                          🎓
                        </span>

                      </div>

                      <div className="mb-5">

                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-400">
                            Destek oranı
                          </span>

                          <span className="text-green-400 font-black">
                            %
                            {
                              department.supportPercent
                            }
                          </span>
                        </div>

                        <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${department.supportPercent}%`,
                            }}
                          />
                        </div>

                      </div>

                      <div className="grid grid-cols-3 gap-2">

                        <div className="bg-green-500/10 rounded-2xl p-3">
                          <p className="text-xs text-green-400">
                            Destek
                          </p>
                          <p className="text-xl font-black text-green-400">
                            {
                              department.support
                            }
                          </p>
                        </div>

                        <div className="bg-red-500/10 rounded-2xl p-3">
                          <p className="text-xs text-red-400">
                            Karşı
                          </p>
                          <p className="text-xl font-black text-red-400">
                            {
                              department.against
                            }
                          </p>
                        </div>

                        <div className="bg-yellow-500/10 rounded-2xl p-3">
                          <p className="text-xs text-yellow-400">
                            Kararsız
                          </p>
                          <p className="text-xl font-black text-yellow-400">
                            {
                              department.undecided
                            }
                          </p>
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>

            {/* FİLTRE + KAYITLAR */}

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7">

              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                <div>
                  <h2 className="text-2xl font-black">
                    Saha Görüşleri
                  </h2>
                  <p className="text-slate-400 mt-1">
                    {filteredOpinions.length} kayıt gösteriliyor
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  {selectedIds.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        handleBulkDelete
                      }
                      className="bg-red-600 hover:bg-red-500 px-4 py-3 rounded-2xl font-bold"
                    >
                      🗑️{" "}
                      {selectedIds.length} Seçiliyi Sil
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleExportCSV
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded-2xl font-bold"
                  >
                    📥 CSV
                  </button>

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mt-6">

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="🔎 Ara..."
                  className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <select
                  value={
                    opinionFilter
                  }
                  onChange={(e) =>
                    setOpinionFilter(
                      e.target.value
                    )
                  }
                  className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="">
                    Tüm görüşler
                  </option>
                  <option value="destekliyor">
                    🟢 Destekliyor
                  </option>
                  <option value="desteklemiyor">
                    🔴 Desteklemiyor
                  </option>
                  <option value="kararsiz">
                    🟡 Kararsız
                  </option>
                </select>

                <select
                  value={
                    departmentFilter
                  }
                  onChange={(e) =>
                    setDepartmentFilter(
                      e.target.value
                    )
                  }
                  className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="">
                    Tüm bölümler
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department}
                        value={department}
                      >
                        {department}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    personnelFilter
                  }
                  onChange={(e) =>
                    setPersonnelFilter(
                      e.target.value
                    )
                  }
                  className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="">
                    Tüm personel
                  </option>

                  {personnelEmails.map(
                    (email) => (
                      <option
                        key={email}
                        value={email}
                      >
                        {email}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(
                      e.target.value
                    )
                  }
                  className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="">
                    Tüm tarihler
                  </option>
                  <option value="today">
                    Bugün
                  </option>
                  <option value="7days">
                    Son 7 gün
                  </option>
                  <option value="month">
                    Bu ay
                  </option>
                </select>

              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-bold"
              >
                Filtreleri temizle
              </button>

              <div className="overflow-x-auto mt-6">

                <table className="w-full min-w-[1100px]">

                  <thead>
                    <tr className="border-b border-slate-800 text-left">

                      <th className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={
                            filteredOpinions.length >
                              0 &&
                            filteredOpinions.every(
                              (item) =>
                                selectedIds.includes(
                                  item.id
                                )
                            )
                          }
                          onChange={
                            toggleAll
                          }
                          className="w-4 h-4"
                        />
                      </th>

                      <th className="px-4 py-4 text-slate-400">
                        Kişi
                      </th>

                      <th className="px-4 py-4 text-slate-400">
                        Bölüm
                      </th>

                      <th className="px-4 py-4 text-slate-400">
                        Görüş
                      </th>

                      <th className="px-4 py-4 text-slate-400">
                        Ekleyen
                      </th>

                      <th className="px-4 py-4 text-slate-400">
                        Not
                      </th>

                      <th className="px-4 py-4 text-slate-400">
                        Tarih
                      </th>

                      <th className="px-4 py-4 text-right text-slate-400">
                        İşlem
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-16 text-slate-500"
                        >
                          Kayıtlar yükleniyor...
                        </td>
                      </tr>
                    ) : filteredOpinions.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-16 text-slate-500"
                        >
                          Kayıt bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredOpinions.map(
                        (item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-800 hover:bg-slate-800/30"
                          >

                            <td className="px-4 py-5">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(
                                  item.id
                                )}
                                onChange={() =>
                                  toggleSelected(
                                    item.id
                                  )
                                }
                                className="w-4 h-4"
                              />
                            </td>

                            <td className="px-4 py-5">
                              <p className="font-bold">
                                {item.name}{" "}
                                {item.surname}
                              </p>

                              {item.phone && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {item.phone}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-5 text-slate-300">
                              {item.department ||
                                "-"}
                            </td>

                            <td className="px-4 py-5">
                              <span
                                className={`inline-flex px-3 py-2 rounded-xl border text-sm font-bold ${opinionStyle(
                                  item.opinion
                                )}`}
                              >
                                {opinionLabel(
                                  item.opinion
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-5 text-sm">
                              {item.created_by_email ||
                                "Bilinmiyor"}
                            </td>

                            <td className="px-4 py-5 text-slate-400 max-w-xs">
                              <p className="truncate">
                                {item.note ||
                                  "-"}
                              </p>
                            </td>

                            <td className="px-4 py-5 text-slate-500 text-sm whitespace-nowrap">
                              {formatDate(
                                item.created_at
                              )}
                            </td>

                            <td className="px-4 py-5 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item.id
                                  )
                                }
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl font-bold"
                              >
                                🗑 Sil
                              </button>
                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </>
        )}

        {/* =========================
            PERSONEL
        ========================= */}

        {activeTab ===
          "personnel" && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

              <div>
                <h2 className="text-3xl font-black">
                  👥 Personel Yönetimi
                </h2>
                <p className="text-slate-400 mt-2">
                  Panel kullanıcılarının yetkilerini yönet.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                {adminUsers.length} kullanıcı
              </div>

            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-5 mb-7">

              <h3 className="font-black text-xl mb-4">
                Yeni Personel Ekle
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                <input
                  value={personnelEmail}
                  onChange={(e) =>
                    setPersonnelEmail(
                      e.target.value
                    )
                  }
                  placeholder="Kullanıcının emaili"
                  className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
                />
<input
  type="password"
  value={personnelPassword}
  onChange={(e) =>
    setPersonnelPassword(
      e.target.value
    )
  }
  placeholder="Şifre"
  className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
/>
                <select
                  value={personnelRole}
                  onChange={(e) =>
                    setPersonnelRole(
                      e.target.value as
                        | "admin"
                        | "personel"
                    )
                  }
                  className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 outline-none"
                >
                  <option value="personel">
                    👤 Personel
                  </option>
                  <option value="admin">
                    👑 Admin
                  </option>
                </select>

                <button
                  type="button"
                  onClick={
                    addPersonnel
                  }
                  className="bg-blue-600 hover:bg-blue-500 rounded-2xl px-4 py-3 font-bold"
                >
                  + Personel Ekle
                </button>

              </div>

              <p className="text-xs text-slate-500 mt-3">
                Kullanıcının Supabase Authentication hesabının zaten oluşturulmuş olması gerekir.
              </p>

            </div>

            <div className="space-y-3">

              {adminUsers.map(
                (user) => (
                  <div
                    key={user.user_id}
                    className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                          {user.role ===
                          "admin"
                            ? "👑"
                            : "👤"}
                        </div>

                        <div>
                          <p className="font-bold break-all">
                            {user.email}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            Eklenme:{" "}
                            {formatDate(
                              user.created_at
                            )}
                          </p>
                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-2">

                        <select
                          value={
                            user.role
                          }
                          onChange={(e) =>
                            changePersonnelRole(
                              user,
                              e.target
                                .value as
                                | "admin"
                                | "personel"
                            )
                          }
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2"
                        >
                          <option value="personel">
                            👤 Personel
                          </option>
                          <option value="admin">
                            👑 Admin
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            removePersonnel(
                              user
                            )
                          }
                          className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl font-bold"
                        >
                          Kaldır
                        </button>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* =========================
            AUDIT LOG
        ========================= */}

        {activeTab ===
          "logs" && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">

            <div className="flex items-center justify-between mb-7">

              <div>
                <h2 className="text-3xl font-black">
                  📜 İşlem Kayıtları
                </h2>

                <p className="text-slate-400 mt-2">
                  Panelde yapılan işlemlerin geçmişi.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  loadAuditLogs
                }
                className="bg-blue-600 px-4 py-3 rounded-2xl font-bold"
              >
                ↻ Yenile
              </button>

            </div>

            <div className="space-y-3">

              {auditLogs.length ===
              0 ? (
                <div className="text-center py-16 text-slate-500">
                  Henüz işlem kaydı yok.
                </div>
              ) : (
                auditLogs.map(
                  (log) => (
                    <div
                      key={log.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5"
                    >

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                        <div>

                          <p className="font-black">
                            {log.action}
                          </p>

                          <p className="text-sm text-slate-400 mt-1">
                            {log.user_email ||
                              "Bilinmeyen kullanıcı"}
                          </p>

                          {log.target_name && (
                            <p className="text-sm text-blue-400 mt-2">
                              Hedef:{" "}
                              {
                                log.target_name
                              }
                            </p>
                          )}

                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs text-slate-500">
                            Tarih
                          </p>

                          <p className="text-sm text-slate-400 mt-1">
                            {formatDate(
                              log.created_at
                            )}
                          </p>
                        </div>

                      </div>

                      {log.details && (
                        <pre className="mt-4 bg-slate-950 rounded-2xl p-4 text-xs text-slate-500 overflow-x-auto">
                          {JSON.stringify(
                            log.details,
                            null,
                            2
                          )}
                        </pre>
                      )}

                    </div>
                  )
                )
              )}

            </div>

          </section>
        )}

        {/* =========================
            ÇÖP KUTUSU
        ========================= */}

        {activeTab ===
          "trash" && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

              <div>
                <h2 className="text-3xl font-black">
                  🗑️ Çöp Kutusu
                </h2>

                <p className="text-slate-400 mt-2">
                  Silinen kayıtları buradan geri yükleyebilirsin.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-4 py-3">
                {deletedOpinions.length} silinmiş kayıt
              </div>

            </div>

            <div className="space-y-3">

              {deletedOpinions.length ===
              0 ? (
                <div className="text-center py-16 text-slate-500">
                  🗑️ Çöp kutusu boş.
                </div>
              ) : (
                deletedOpinions.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5"
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>

                          <p className="font-black text-lg">
                            {
                              item.data.name
                            }{" "}
                            {
                              item.data
                                .surname
                            }
                          </p>

                          <p className="text-sm text-slate-400 mt-1">
                            {
                              item.data
                                .department ||
                              "Bölüm belirtilmemiş"
                            }
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">

                            <span
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${opinionStyle(
                                item.data
                                  .opinion
                              )}`}
                            >
                              {opinionLabel(
                                item.data
                                  .opinion
                              )}
                            </span>

                            <span className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs">
                              Silen:{" "}
                              {item.deleted_by_email ||
                                "Bilinmiyor"}
                            </span>

                          </div>

                          <p className="text-xs text-slate-500 mt-3">
                            Silinme:{" "}
                            {formatDate(
                              item.deleted_at
                            )}
                          </p>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              restoreOpinion(
                                item
                              )
                            }
                            className="bg-green-600 hover:bg-green-500 px-4 py-3 rounded-xl font-bold"
                          >
                            ↩ Geri Yükle
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              permanentlyDelete(
                                item
                              )
                            }
                            className="bg-red-600 hover:bg-red-500 px-4 py-3 rounded-xl font-bold"
                          >
                            Kalıcı Sil
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </section>
        )}

        {/* =========================
            AYARLAR
        ========================= */}

        {activeTab ===
          "settings" && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">

            <div className="mb-7">

              <h2 className="text-3xl font-black">
                ⚙️ Panel Ayarları
              </h2>

              <p className="text-slate-400 mt-2">
                Yönetim panelinin davranışlarını buradan değiştir.
              </p>

            </div>

            <div className="space-y-4 max-w-3xl">

              <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5">

                <label className="text-sm text-slate-400">
                  Panel başlığı
                </label>

                <input
                  value={panelTitle}
                  onChange={(e) =>
                    setPanelTitle(
                      e.target.value
                    )
                  }
                  className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
                />

              </div>

              <label className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer">

                <div>
                  <p className="font-bold">
                    🔔 Yeni kayıt bildirimleri
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Yeni görüş geldiğinde panelde bildirim göster.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    notificationsEnabled
                  }
                  onChange={(e) =>
                    setNotificationsEnabled(
                      e.target.checked
                    )
                  }
                  className="w-6 h-6"
                />

              </label>

              <label className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer">

                <div>
                  <p className="font-bold">
                    🔄 Otomatik yenileme
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Panel 30 saniyede bir yeni kayıtları kontrol eder.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    autoRefreshEnabled
                  }
                  onChange={(e) =>
                    setAutoRefreshEnabled(
                      e.target.checked
                    )
                  }
                  className="w-6 h-6"
                />

              </label>

              <button
                type="button"
                disabled={
                  settingsSaving
                }
                onClick={
                  saveAllSettings
                }
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl px-5 py-4 font-black transition"
              >
                {settingsSaving
                  ? "Kaydediliyor..."
                  : "💾 Ayarları Kaydet"}
              </button>

              <div className="border-t border-slate-800 pt-6 mt-6">

                <h3 className="text-xl font-black mb-3">
                  💾 Yedekleme
                </h3>

                <p className="text-slate-500 text-sm mb-4">
                  Mevcut görüşleri ve panel ayarlarını JSON dosyası olarak bilgisayarına kaydet.
                </p>

                <button
                  type="button"
                  onClick={
                    exportBackup
                  }
                  className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-2xl font-bold"
                >
                  📦 JSON Yedeği Al
                </button>

              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-5">

                <p className="text-yellow-400 font-bold">
                  ⚠️ Yedekleme hakkında
                </p>

                <p className="text-sm text-slate-500 mt-2">
                  JSON yedeği bilgisayarına indirilir. Bu sürümde güvenli geri yükleme işlemi doğrudan tarayıcıdan yapılmaz; yanlışlıkla mevcut verilerin üzerine yazılmasını önlemek için geri yükleme kontrollü yapılmalıdır.
                </p>

              </div>

            </div>

          </section>
        )}

        <p className="text-center text-xs text-slate-700 mt-8">
          Saha360 • Yönetim Paneli •{" "}
          {currentUserEmail}
        </p>

      </div>

      {/* PERSONEL DETAY MODALI */}

      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() =>
            setSelectedPersonnel(null)
          }
        >

          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-6">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h2 className="text-2xl font-black">
                    👤 Personel Detayı
                  </h2>

                  <p className="text-slate-400 text-sm mt-1 break-all">
                    {
                      selectedPerson.email
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPersonnel(
                      null
                    )
                  }
                  className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-xl"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-500">
                    Toplam
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {
                      selectedPerson.total
                    }
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-xs text-blue-400">
                    Bugün
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {
                      selectedPerson.today
                    }
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <p className="text-xs text-purple-400">
                    Bu Ay
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {
                      selectedPerson.thisMonth
                    }
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                  <p className="text-xs text-green-400">
                    Destek
                  </p>
                  <p className="text-3xl font-black text-green-400 mt-2">
                    {
                      selectedPerson.support
                    }
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">

                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                  <p className="text-green-400">
                    🟢 Destekliyor
                  </p>
                  <p className="text-3xl font-black text-green-400 mt-2">
                    {
                      selectedPerson.support
                    }
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-red-400">
                    🔴 Desteklemiyor
                  </p>
                  <p className="text-3xl font-black text-red-400 mt-2">
                    {
                      selectedPerson.against
                    }
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <p className="text-yellow-400">
                    🟡 Kararsız
                  </p>
                  <p className="text-3xl font-black text-yellow-400 mt-2">
                    {
                      selectedPerson.undecided
                    }
                  </p>
                </div>

              </div>

              <div className="mt-7">

                <h3 className="text-xl font-black mb-4">
                  Son Görüşler
                </h3>

                <div className="space-y-3">

                  {selectedPersonOpinions
                    .slice(0, 20)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4"
                      >

                        <div className="flex flex-col md:flex-row md:justify-between gap-3">

                          <div>

                            <p className="font-bold">
                              {item.name}{" "}
                              {
                                item.surname
                              }
                            </p>

                            <div className="flex flex-wrap gap-2 mt-2">

                              <span
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${opinionStyle(
                                  item.opinion
                                )}`}
                              >
                                {opinionLabel(
                                  item.opinion
                                )}
                              </span>

                              {item.department && (
                                <span className="bg-slate-700 px-3 py-1.5 rounded-lg text-xs">
                                  {
                                    item.department
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                          <p className="text-xs text-slate-500">
                            {formatDate(
                              item.created_at
                            )}
                          </p>

                                         </div>

                      {item.note && (
                        <div className="mt-4 pt-3 border-t border-slate-700">
                          <p className="text-sm text-slate-300">
                            {item.note}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">

                        {item.created_at && (
                          <p className="text-xs text-slate-500">
                            🕒 {formatDate(item.created_at)}
                          </p>
                        )}

                        <p className="text-xs text-blue-400 font-semibold">
                          👤 Kaydeden:{" "}
                          {item.created_by_email || "Bilinmiyor"}
                        </p>

                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}