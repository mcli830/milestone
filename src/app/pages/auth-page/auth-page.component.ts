import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.css']
})
export class AuthPageComponent implements OnInit {

  url: string;

  constructor(
    private router: Router
  ) {
    this.url = this.router.url;
  }

  ngOnInit(): void {
  }

  get register(): boolean {
    return this.url.slice(0, 9) === '/register';
  }

  get formHeader(): string {
    return this.register ? 'Sign up' : 'Log in';
  }

}
