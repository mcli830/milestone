import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebRequestInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService
  ) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // add headers to request object
    // request = this.addAuthHeader(request);

    // handle new response
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(err);
      })
    );
  }

  // add access token header to any requests to api
  addAuthHeader(request: HttpRequest<any>): HttpRequest<any> {

    // get user from AuthService
    const user = this.authService.user;

    if (user) {
      // insert user id into header
      return request.clone({
        setHeaders: {
          _id: user._id,
        }
      });
    }

    return request;
  }

}
