import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-index-page',
  templateUrl: './index-page.component.html',
  styleUrls: ['./index-page.component.css']
})
export class IndexPageComponent implements OnInit {

  user: User;

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }

}
