import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  headers = new HttpHeaders().set('Content-Type', 'application/json');
  user: User;

  constructor(
    private httpClient: HttpClient,
    public router: Router,
  ) {
    // initialize(login) user if localStorage contains user-id key
  }

  register(user: User): Observable<any> {
    // return Subscription observer
    return this.httpClient.post('/auth/users', user, {
      observe: 'response',
    }).pipe(
      // prevent multicasting
      shareReplay(),
      // .tap() performs a side-effect for each response
      // update local storage with token headers
      tap(this.storeSession.bind(this))
    );

    /*
     *  localStorage is updated in .pipe() middleware to allow
     *  component-level functions to .subscribe() to the returned
     *  Subscription and handle the response outside of the service
     */
  }

  getUser(){
    return this.user;
  }

  private updateUser(userData: User) {
    this.user = userData;
  }

  private storeSession(res: HttpResponse<any>): void {
    localStorage.setItem('user-id', res.body._id);
    localStorage.setItem('access-token', res.headers.get('x-access-token'));
    localStorage.setItem('session-token', res.headers.get('x-session-token'));
    console.log('Registered and session stored');
    this.updateUser(res.body);
  }

  private getAccessToken() {
    return localStorage.getItem('access-token');
  }

}
