import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin, Users, TrendingUp, CircleCheck as CheckCircle, Trophy, MessageSquare, Star, Activity, Zap, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getCurrentUser, getUserProfile, getIssues, getPosts, getTenders, getUserBids, getUserNotifications, getLeaderboard, getUserIssues } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    pendingIssues: 0,
    myIssues: 0,
    communityPosts: 0,
    activeTenders: 0,
    myBids: 0,
    points: 0,
    rank: '-',
    responseTime: '0 days',
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Photo carousel data
  const carouselImages = [
    { 
      id: 1, 
      url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=200&fit=crop&crop=center',
      title: 'Smart City Initiative',
      desc: 'Building tomorrow'
    },
    { 
      id: 2, 
      url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop&crop=center',
      title: 'Community Progress',
      desc: 'Together we grow'
    },
    { 
      id: 3, 
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop&crop=center',
      title: 'Infrastructure Growth',
      desc: 'Modern solutions'
    },
    { 
      id: 4, 
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop&crop=center',
      title: 'Urban Development',
      desc: 'Future ready'
    },
  ];

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { user: currentUser, error: userError } = await getCurrentUser();
      if (userError) throw userError;
      if (!currentUser) throw new Error('User not signed in');
      setUser(currentUser);

      const { data: profileData, error: profileError } = await getUserProfile(currentUser.id);
      if (profileError) throw profileError;
      setProfile(profileData);

      await Promise.all([
        loadIssuesData(currentUser.id),
        loadCommunityData(),
        loadTendersData(currentUser.id, profileData?.user_type),
        loadNotifications(currentUser.id),
        loadLeaderboardStats(currentUser.id)
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboardStats = async (userId) => {
    try {
      const { data: leaderboardData, error } = await getLeaderboard('month');
      if (error) throw error;

      const sorted = (leaderboardData || []).sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
      const currentUserStats = sorted.find(u => u.id === userId) || {};
      const rank = sorted.findIndex(u => u.id === userId) + 1 || '-';
      const points = currentUserStats.total_score || 0;
      const myIssues = currentUserStats.issues_reported || 0;

      setStats(prev => ({ ...prev, points, rank, myIssues }));
    } catch (error) {
      console.error('Error loading leaderboard stats:', error);
    }
  };

  const loadIssuesData = async (userId) => {
    try {
      const { data: allIssues, error } = await getIssues();
      if (error) throw error;

      const totalIssues = allIssues?.length || 0;
      const resolvedIssues = allIssues?.filter(i => i.status === 'resolved').length || 0;
      const pendingIssues = allIssues?.filter(i => i.status === 'pending').length || 0;

      const resolvedWithDates = allIssues?.filter(i => i.status === 'resolved' && i.resolved_at && i.created_at) || [];
      let avgResponseTime = '0 days';
      if (resolvedWithDates.length > 0) {
        const totalDays = resolvedWithDates.reduce((sum, issue) => {
          const created = new Date(issue.created_at);
          const resolved = new Date(issue.resolved_at);
          return sum + Math.ceil((resolved - created) / (1000 * 60 * 60 * 24));
        }, 0);
        avgResponseTime = `${Math.round(totalDays / resolvedWithDates.length)} days`;
      }

      setStats(prev => ({
        ...prev,
        totalIssues,
        resolvedIssues,
        pendingIssues,
        responseTime: avgResponseTime,
      }));

      const recentIssues = allIssues?.slice(0, 5).map(issue => ({
        id: issue.id,
        type: 'issue',
        title: issue.title,
        status: issue.status,
        time: getTimeAgo(issue.created_at),
        icon: getIssueIcon(issue.category),
        color: getStatusColor(issue.status),
      })) || [];
      setRecentActivity(prev => [...prev, ...recentIssues]);

    } catch (error) {
      console.error('Error loading issues data:', error);
    }
  };

  const loadCommunityData = async () => {
    try {
      const { data: posts, error } = await getPosts();
      if (error) throw error;
      setStats(prev => ({ ...prev, communityPosts: posts?.length || 0 }));

      const recentPosts = posts?.slice(0, 3).map(post => ({
        id: post.id,
        type: 'post',
        title: post.content.substring(0, 50) + '...',
        status: 'active',
        time: getTimeAgo(post.created_at),
        icon: '💬',
        color: '#7C3AED',
      })) || [];
      setRecentActivity(prev => [...prev, ...recentPosts]);
    } catch (error) {
      console.error('Error loading community data:', error);
    }
  };

  const loadTendersData = async (userId, userType) => {
    try {
      const { data: tenders, error } = await getTenders();
      if (error) throw error;

      setStats(prev => ({ ...prev, activeTenders: tenders?.filter(t => t.status === 'available').length || 0 }));

      if (userType === 'tender') {
        const { data: bids, error: bidsError } = await getUserBids();
        if (!bidsError) {
          const activeBids = bids?.filter(b => b.status === 'submitted').length || 0;
          const wonBids = bids?.filter(b => b.status === 'accepted').length || 0;
          setStats(prev => ({ 
            ...prev, 
            myBids: activeBids,
            wonContracts: wonBids
          }));
        }
      }
    } catch (error) {
      console.error('Error loading tenders data:', error);
    }
  };

  const loadNotifications = async (userId) => {
    try {
      const { data, error } = await getUserNotifications();
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return `${Math.floor(diffInDays / 7)}w`;
  };

  const getIssueIcon = (category) => {
    const icons = { roads: '🛣️', utilities: '⚡', environment: '🌱', safety: '🚨', parks: '🌳', other: '📋' };
    return icons[category] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = { 
      pending: '#F59E0B', 
      acknowledged: '#3B82F6', 
      in_progress: '#8B5CF6', 
      resolved: '#10B981', 
      closed: '#6B7280', 
      rejected: '#EF4444' 
    };
    return colors[status] || '#6B7280';
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const onRefresh = async () => { 
    setRefreshing(true); 
    await loadData(); 
    setRefreshing(false); 
  };

  if (loading) {
    return (
      <LinearGradient 
        colors={['#DBEAFE', '#EFF6FF', '#F8FAFC']} 
        style={styles.loadingContainer}
      >
        <View style={styles.loadingSpinner}>
          <Activity size={24} color="#2563EB" />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#DBEAFE', '#EFF6FF', '#F8FAFC']} 
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'User'}!
              </Text>
              <View style={styles.userBadge}>
                <Text style={styles.userType}>
                  {getUserTypeDisplay(profile?.user_type)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell size={18} color="#1F2937" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationCount}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Carousel */}
        <View style={styles.carouselSection}>
          <View style={styles.carousel}>
            <Image 
              source={{ uri: carouselImages[currentImageIndex].url }}
              style={styles.carouselImage}
            />
            <View style={styles.carouselOverlay}>
              <View style={styles.carouselContent}>
                <Text style={styles.carouselTitle}>
                  {carouselImages[currentImageIndex].title}
                </Text>
                <Text style={styles.carouselDesc}>
                  {carouselImages[currentImageIndex].desc}
                </Text>
              </View>
              <View style={styles.carouselControls}>
                <TouchableOpacity onPress={prevImage} style={styles.carouselBtn}>
                  <ChevronLeft size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={nextImage} style={styles.carouselBtn}>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.carouselDots}>
              {carouselImages.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.dot, 
                    index === currentImageIndex && styles.activeDot
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                <MapPin size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.statNumber}>{stats.myIssues}</Text>
              <Text style={styles.statLabel}>Issues</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
                <CheckCircle size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.statNumber}>{stats.resolvedIssues}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
                <Trophy size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.statNumber}>#{stats.rank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF6' }]}>
                <Star size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.statNumber}>{stats.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Community Impact */}
        <View style={styles.impactSection}>
          <Text style={styles.sectionTitle}>Community Impact</Text>
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <View style={styles.impactHeader}>
                <TrendingUp size={16} color="#059669" />
                <Text style={styles.impactValue}>{stats.totalIssues}</Text>
              </View>
              <Text style={styles.impactLabel}>Total Issues</Text>
              <Text style={styles.impactSub}>Community wide</Text>
            </View>

            <View style={styles.impactCard}>
              <View style={styles.impactHeader}>
                <Zap size={16} color="#DC2626" />
                <Text style={styles.impactValue}>
                  {stats.totalIssues > 0 ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0}%
                </Text>
              </View>
              <Text style={styles.impactLabel}>Resolution Rate</Text>
              <Text style={styles.impactSub}>This month</Text>
            </View>

            <View style={styles.impactCard}>
              <View style={styles.impactHeader}>
                <Activity size={16} color="#7C2D12" />
                <Text style={styles.impactValue}>{stats.responseTime}</Text>
              </View>
              <Text style={styles.impactLabel}>Avg Response</Text>
              <Text style={styles.impactSub}>Time to resolve</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/user-reports')}>
              <Text style={styles.seeAllBtn}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {recentActivity.slice(0, 4).map((activity, index) => (
              <TouchableOpacity key={`${activity.type}-${activity.id}-${index}`} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>{activity.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                <View style={[styles.activityStatus, { backgroundColor: activity.color }]}>
                  <Text style={styles.statusText}>{activity.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: MapPin, label: 'Report', color: '#EF4444', bg: '#FEF2F2' },
              { icon: TrendingUp, label: 'Analytics', color: '#F59E0B', bg: '#FFFBEB' },
              { icon: Users, label: 'Community', color: '#10B981', bg: '#ECFDF5' },
              { icon: MessageSquare, label: 'Messages', color: '#8B5CF6', bg: '#F5F3FF' },
            ].map((action, index) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity key={index} style={[styles.actionCard, { backgroundColor: action.bg }]}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <IconComponent size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Contractor Dashboard */}
        {profile?.user_type === 'tender' && (
          <View style={styles.contractorSection}>
            <Text style={styles.sectionTitle}>Contractor Hub</Text>
            <View style={styles.contractorCards}>
              <View style={styles.contractorCard}>
                <View style={[styles.contractorIcon, { backgroundColor: '#3B82F6' }]}>
                  <Target size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.contractorNumber}>{stats.activeTenders}</Text>
                <Text style={styles.contractorLabel}>Active Tenders</Text>
              </View>
              
              <View style={styles.contractorCard}>
                <View style={[styles.contractorIcon, { backgroundColor: '#10B981' }]}>
                  <Award size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.contractorNumber}>{stats.myBids}</Text>
                <Text style={styles.contractorLabel}>My Bids</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const getUserTypeDisplay = (userType) => {
  switch (userType) {
    case 'admin': return 'Admin';
    case 'area_super_admin': return 'Area Admin';
    case 'department_admin': return 'Dept Admin';
    case 'tender': return 'Contractor';
    default: return 'Citizen';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  userBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  userType: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  notificationBtn: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  carouselSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  carousel: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 20,
  },
  carouselContent: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  carouselDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  carouselControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  carouselBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  impactSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  impactLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  impactSub: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllBtn: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  contractorSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contractorCards: {
    flexDirection: 'row',
    gap: 12,
  },
  contractorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contractorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contractorNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  contractorLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
});