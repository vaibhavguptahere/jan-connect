// app/_layout.js
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Menu, User, X, Home, MapPin, Trophy, MessageSquare, Phone, MessageCircle, Settings, LogOut } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Drawer Content Component
function CustomDrawerContent(props) {
  const { t } = useTranslation();
  
  return (
    <SafeAreaView style={styles.drawerContainer}>
      {/* Drawer Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.drawerHeaderContent}>
          <TouchableOpacity 
            onPress={() => props.navigation.closeDrawer()}
            style={styles.closeButton}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <View style={styles.drawerItems}>
          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('index')}
          >
            <Home size={20} color="#374151" />
            <Text style={styles.drawerItemText}>{t('navigation.home')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('report')}
          >
            <MapPin size={20} color="#374151" />
            <Text style={styles.drawerItemText}>{t('navigation.report')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('heatmap')}
          >
            <MapPin size={20} color="#374151" />
            <Text style={styles.drawerItemText}>{t('navigation.heatmap')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('leaderboard')}
          >
            <Trophy size={20} color="#374151" />
            <Text style={styles.drawerItemText}>{t('navigation.leaderboard')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('community')}
          >
            <MessageSquare size={20} color="#374151" />
            <Text style={styles.drawerItemText}>{t('navigation.community')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('contact')}
          >
            <Phone size={20} color="#374151" />
            <Text style={styles.drawerItemText}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('feedback')}
          >
            <MessageCircle size={20} color="#374151" />
            <Text style={styles.drawerItemText}>Feedback</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={() => props.navigation.navigate('settings')}
          >
            <Settings size={20} color="#374151" />
            <Text style={styles.drawerItemText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.drawerItem, styles.logoutItem]}
            onPress={() => {
              // Handle logout
              console.log('Logout pressed');
            }}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.drawerItemText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

// Custom Header Component
function CustomHeader({ navigation, route, options }) {
  return (
    <View style={styles.header}>
      {/* Left Side - Menu Button */}
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()}
        style={styles.menuButton}
      >
        <Menu size={24} color="#fff" />
      </TouchableOpacity>

      {/* Center - Title */}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>
          {options.headerTitle || options.title || route.name}
        </Text>
      </View>

      {/* Right Side - Profile Button */}
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => navigation.navigate('profile')}
      >
        <User size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          drawerStyle: {
            width: 280,
          },
          drawerType: 'slide',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          drawerActiveTintColor: '#1E40AF',
          drawerInactiveTintColor: '#6B7280',
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: t('navigation.home'),
            headerTitle: 'Dashboard',
          }}
        />
        <Drawer.Screen
          name="report"
          options={{
            title: t('navigation.report'),
            headerTitle: 'Report Issue',
          }}
        />
        <Drawer.Screen
          name="heatmap"
          options={{
            title: t('navigation.heatmap'),
            headerTitle: 'Issue Map',
          }}
        />
        <Drawer.Screen
          name="leaderboard"
          options={{
            title: t('navigation.leaderboard'),
            headerTitle: 'Leaderboard',
          }}
        />
        <Drawer.Screen
          name="community"
          options={{
            title: t('navigation.community'),
            headerTitle: 'Community',
          }}
        />
        <Drawer.Screen
          name="contact"
          options={{
            title: 'Contact',
            headerTitle: 'Contact Support',
          }}
        />
        <Drawer.Screen
          name="feedback"
          options={{
            title: 'Feedback',
            headerTitle: 'Feedback',
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'My Profile',
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: 'Settings',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    height: Platform.OS === 'ios' ? 100 : 70,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Drawer Styles
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    backgroundColor: '#1E40AF',
    paddingBottom: 20,
  },
  drawerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
  },
  drawerItems: {
    paddingVertical: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
  },
});

// You'll also need to install these dependencies:
// npm install react-native-gesture-handler
// npm install @react-navigation/drawer
// npx expo install react-native-gesture-handler react-native-reanimated