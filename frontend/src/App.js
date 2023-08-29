import { useState, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch
} from 'react-router-dom';

import NewPlace from './places/pages/NewPlace';
import UpdatePlace from './places/pages/UpdatePlace';
import UserPlaces from './places/pages/UserPlaces';
import MainNavigation from './shared/components/Navigation/MainNavigation';
import { AuthContext } from './shared/context/auth-context';
import Auth from './user/pages/Auth';
import Users from './user/pages/Users';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(false);

  const login = useCallback((uid) => {
    setIsLoggedIn(true);
    setUserId(uid);
  }, []);
  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUserId(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        userId: userId,
        login: login,
        logout: logout
      }}>
      <Router>
        <MainNavigation />
        <main>
          <Switch>
            <Route path='/' exact>
              <Users />
            </Route>
            <Route path='/:userId/place' exact>
              <UserPlaces />
            </Route>
            <Route path='/places/new' exact>
              <NewPlace />
            </Route>
            <Route path='/places/:placeId' exact>
              <UpdatePlace />
            </Route>
            <Route path='/authenticate' exact>
              <Auth />
            </Route>
            <Redirect to='/' />
          </Switch>
        </main>
      </Router>
    </AuthContext.Provider >
  );
}

export default App;
