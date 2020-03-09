import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  headers = new HttpHeaders().set('Content-Type', 'application/json');
  user: User;
  userObserver: Subject<User> = new Subject<User>();

  constructor(private httpClient: HttpClient, public router: Router) {
    // make user observable
    this.userObserver.subscribe((value: User) => {
      this.user = value;
    });
    // initialize(login) user if localStorage contains user-id key
  }

  getUser() {
    return this.user;
  }

  register(user: User): Observable<any> {
    // return Subscription observable
    return this.httpClient.post(
        '/auth/users',
        user,
        { observe: 'response' }
      ).pipe(
        shareReplay(), // prevent multicasting
        tap(this.storeSession.bind(this)) // update cache, then return Observable
      );

    /*
     *  localStorage is updated in .pipe() middleware to allow
     *  component-level functions to .subscribe() to the returned
     *  Subscription and handle the response outside of the service
     */
  }

  login(user: User): Observable<any> {
    // return Subscription observable
    return this.httpClient.post(
      '/auth/users/login',
      user,
      { observe: 'response' }
    ).pipe(
      shareReplay(),
      tap(this.storeSession.bind(this))
    );
  }

  logout(): void {
    this.clearSession();
    this.updateUser(null);
    console.log('logout')
  }

  private updateUser(user: User) {
    this.userObserver.next(user);
  }

  private storeSession(res: HttpResponse<any>): void {
    localStorage.setItem('user-id', res.body._id);
    localStorage.setItem('access-token', res.headers.get('x-access-token'));
    localStorage.setItem('session-token', res.headers.get('x-session-token'));
    console.log('Registered and session stored');
    this.updateUser(res.body);
  }

  private clearSession(): void {
    localStorage.removeItem('user-id');
    localStorage.removeItem('access-token');
    localStorage.removeItem('session-token');
    console.log('Logged out');
    this.updateUser(null);
  }

  private getAccessToken(): string {
    return localStorage.getItem('access-token');
  }
}
