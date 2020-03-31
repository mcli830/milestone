import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // tslint:disable-next-line: variable-name
  _user: User;
  userObserver: Subject<User> = new Subject<User>();

  constructor(private httpClient: HttpClient, public router: Router) {
    // make user observable
    this.userObserver.subscribe((value: User) => {
      this._user = value;
    });
    // initialize(login) user if localStorage contains user-id key
  }

  get user() {
    return this._user;
  }

  getAccessToken() {
    return this.httpClient.get(
      '/auth/users/me/access-token',
      { observe: 'response' }
    ).pipe(
      tap(this.saveUserData.bind(this)),
      catchError((err: HttpErrorResponse) => {
        return throwError(err);
      })
    )
  }

  register(user: User): Observable<HttpResponse<any>> {
    // return Subscription observable
    return this.httpClient.post(
      '/auth/users',
      user,
      { observe: 'response' }
    ).pipe(
      shareReplay(), // prevent multicasting
      tap(this.saveUserData.bind(this)) // side effect function before sending to subscribe
    );
  }

  login(user: User): Observable<HttpResponse<any>> {
    // return Subscription observable
    return this.httpClient.post(
      '/auth/users/login',
      user,
      { observe: 'response' }
    ).pipe(
      shareReplay(),
      tap(this.saveUserData.bind(this))
    );
  }

  logout(): Observable<HttpResponse<any>> {
    // request cookie deletion from server
    return this.httpClient.get(
      '/auth/users/logout',
      { observe: 'response' }
    ).pipe(
      tap(this.clearUserData.bind(this))
    );
  }

  // extract user data from response and save to Au
  private saveUserData(res: HttpResponse<any>): void {
    this.userObserver.next(res.body);
  }

  // remove user data
  private clearUserData(): void {
    this.userObserver.next(null);
  }
}
